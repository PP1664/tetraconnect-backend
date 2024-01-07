import { Controller, Get } from '@nestjs/common';

@Controller('friend-request')
export class FriendRequestController {
  @Get('send')
  sendFriendRequest(): string {
    return 'Send';
  }
}
