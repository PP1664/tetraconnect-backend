import { Controller, Post, Query } from '@nestjs/common';
import { firestore, sendNotification } from '../util/firebase';
import { platforms } from 'src/util/constants';

@Controller('friend-request')
export class FriendRequestController {
  @Post('send')
  async sendFriendRequest(
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<string> {
    const userFrom = await firestore.doc(`users/${from}`).get();
    const userTo = await firestore.doc(`users/${to}`).get();

    if (!userFrom.exists) return 'User from does not exist';
    if (!userTo.exists) return 'User to does not exist';

    if (
      !(
        await firestore
          .collection(`friends`)
          .where('from', '==', userFrom.ref)
          .where('to', '==', userTo.ref)
          .get()
      ).empty
    ) {
      return 'Friend request already exists';
    }

    await firestore.collection('friends').add({
      from: userFrom.ref,
      to: userTo.ref,
      users: [userFrom.ref, userTo.ref],
      state: 'pending',
    });

    let tokens = [];

    for (const platform in platforms) {
      tokens = tokens.concat(userTo.data[`${platform}_tokens`]);
    }

    sendNotification({
      tokens: tokens,
      title: `${userFrom.data['displayName']} as sent you a friend request!`,
      body: 'Click this notification to open the app',
      data: {
        type: 'friendRequest',
        fromDisplayName: userFrom.data['displayName'],
        fromPhotoUrl: userFrom.data['photoUrl'],
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      image: userFrom.data['photoUrl'],
    });
  }

  @Post('/remove')
  async removeFriend(
    @Query('user') userID: string,
    @Query('removed') removedID: string,
  ) {
    const user = await firestore.doc(`users/${userID}`).get();
    const removed = await firestore.doc(`users/${removedID}`).get();

    if (!user.exists) return 'User does not exist';
    if (!removed.exists) return 'Removed friend does not exist';

    const friends = await firestore
      .collection('friends')
      .where('users', 'in', [[user.ref, removed.ref], [removed.ref, user.ref]])
      .get();

    if (friends.docs.length === 0) {
      return 'Removed user not in friend list';
    }

    await friends.docs[0].ref.delete();

    let tokens = [];

    for (const platform in platforms) {
      tokens = tokens.concat(removed.data[`${platform}_tokens`]);
    }

    try {
      await sendNotification({
        tokens: tokens,
        image: user.data()['photoUrl'],
        title: `${user.data()['displayName']} has removed you as a friend`,
        body: 'Click this notification to open the app',
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type: 'removeFriend',
          userDisplayName: user.data()['displayName'],
          userPhotoUrl: user.data()['photoUrl'],
        },
      });
    } finally {
      return 'Friend removed';
    }
  }
}
