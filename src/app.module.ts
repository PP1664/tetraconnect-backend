import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FriendRequestController } from './friend-request/friend-request.controller';

@Module({
  imports: [],
  controllers: [AppController, FriendRequestController],
})
export class AppModule {}
