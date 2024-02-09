import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { firestore } from './util/firebase';
import { firestore as fs } from 'firebase-admin';
import { randomUUID } from 'crypto';

interface Lobby {
  id: string,
  players: Map<string, fs.DocumentReference>,
  avgRating: number,
}

interface LobbyEmit { // Used to stringify a Lobby to emit to other sockets
  id: string,
  players: Object,
}

interface Move {
  circle: number,
  cross: number,
  square: number,
  triangle: number,
}

interface Game {
  id: string,
  players: Map<string, fs.DocumentReference>,
  results: Map<string, fs.DocumentReference>,
  time: fs.FieldValue,
  moves: Move[],
}

interface GameEmit { // Used to stringify a Game to emit to other sockets
  id: string,
  players: Object,
  results: Object,
  moves: Move[],
}

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  turnOrder = ['circle', 'square', 'triangle', 'cross'];
  lobbies: Lobby[] = []; // Current lobbies (for matchmaking)
  games: Game[] = []; // Current games being played

  handleConnection(client: Socket) {
    client.join('everyone');
  }

  handleDisconnect(client: Socket) {
    client.leave('everyone');
  }

  @SubscribeMessage('joinGame')
  async joinGame(client: Socket, body: any) {
    // Matchmaking logic
    const uid: string = body.uid;
    const user = await firestore.doc(`users/${uid}`).get();
    const rating = user.data()['rating'];

    // Find existing lobbies or create one
    if (this.lobbies.length === 0) {
      const id = randomUUID();
      this.lobbies = [{
        id: id,
        players: new Map([['circle', user.ref]]),
        avgRating: rating,
      }];
      client.join(id);
      const lobbyEmit: LobbyEmit = {
        players: Object.fromEntries(this.lobbies[0].players),
        id: id,
      }
      this.server.to(id).emit('joinLobby', JSON.stringify(lobbyEmit));
    } else {
      this.lobbies.sort((a, b) => Math.abs(a.avgRating - rating) - Math.abs(b.avgRating - rating)); // Sort by difference in rating
      // Join the first lobby in the list
      client.join(this.lobbies[0].id);
      if (this.lobbies[0].players.size !== 3) {
        // Modify lobby
        const lobbyId = this.lobbies[0].id;
        this.lobbies[0].players.set(this.turnOrder[this.lobbies[0].players.size], user.ref);
        this.lobbies[0].avgRating = (this.lobbies[0].avgRating * (this.lobbies[0].players.size - 1) + rating) / this.lobbies[0].players.size;
        client.join(lobbyId);
        const lobbyEmit: LobbyEmit = {
          players: Object.fromEntries(this.lobbies[0].players),
          id: lobbyId,
        }
        this.server.to(lobbyId).emit('joinLobby', JSON.stringify(lobbyEmit));
      } else {
        // Convert to game
        const lobbyInfo = this.lobbies.shift();
        this.games.push({
          id: lobbyInfo.id,
          results: new Map(),
          players: lobbyInfo.players,
          time: fs.FieldValue.serverTimestamp(),
          moves: [],
        });
        const gameEmit: GameEmit = {
          id: lobbyInfo.id,
          results: Object.fromEntries(new Map()),
          players: Object.fromEntries(lobbyInfo.players),
          moves: [],
        }
        this.server.to(lobbyInfo.id).emit('gameStart', JSON.stringify(gameEmit));
      }
    }
  }

  @SubscribeMessage('leaveLobby')
  leaveLobby(client: Socket, body: any) {
    const { lobbyId, uid } = body;
    client.leave(lobbyId);
    this.lobbies.filter((e) => e.id === id)[0].players.values.filter()
  }

  @SubscribeMessage('makeMove')
  makeMove(client: Socket, body: any) {
    const { gameId, column, playerId } = body;
  }
}
