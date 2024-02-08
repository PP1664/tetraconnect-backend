import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { firestore } from './util/firebase';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

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
    const currentLobbies = await firestore.collection('lobbies').get();
  }
}
