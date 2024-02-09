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
    } else {
      this.lobbies.sort((a, b) => Math.abs(a.avgRating - rating) - Math.abs(b.avgRating - rating)); // Sort by difference in rating
      // Join the first lobby in the list
      client.join(this.lobbies[0].id);
      if (this.lobbies[0].players.size !== 3) {
        // Modify lobby
        this.lobbies[0].players.set(this.turnOrder[this.lobbies[0].players.size], user.ref);
        this.lobbies[0].avgRating = (this.lobbies[0].avgRating * (this.lobbies[0].players.size - 1) + rating) / this.lobbies[0].players.size;
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
        this.server.to(lobbyInfo.id).emit('gameStart', lobbyInfo.id);
      }
    }
  }

  @SubscribeMessage('makeMove')
  makeMove(client: Socket, body: any) {
    const { gameId, column, playerId } = body;
  }
}
