import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FriendRequestController } from './friend-request/friend-request.controller';
import { FriendController } from './friend/friend.controller';

@Module({
  imports: [],
  controllers: [AppController, FriendRequestController, FriendController],
})
export class AppModule {}
