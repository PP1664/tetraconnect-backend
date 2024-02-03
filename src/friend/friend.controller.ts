import { Controller, Post, Query } from '@nestjs/common';
import { firestore, sendNotification } from '../util/firebase';
import { platforms } from 'src/util/constants';

@Controller('friend')
export class FriendController {
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

  @Post('message')
  async message(
    @Query('user') userID: string,
    @Query('text') text: string,
    @Query('friend') friendID: string,
  ) {
    const user = await firestore.doc(`users/${userID}`).get();

    if (!user.exists) {
      return 'User does not exist';
    }

    const friend = await firestore.doc(`friends/${friendID}`).get();

    if (!friend.exists) {
      return 'Friend group does not exist';
    }

    if (!friend.data()['users'].map((e) => e.id).includes(userID)) {
      return 'User not in friend group';
    }

    if (friend.data()['state'] !== 'accepted') {
      return 'Friend request not yet accepted';
    }

    await friend.ref.collection('messages').add({
      text: text,
      time: FirebaseFirestore.FieldValue.serverTimestamp(),
      user: user.ref,
    });

    const otherUser = await friend.data()['users'].filter((e) => e.id !== user.id)[0].get();
    let tokens = [];

    for (const platform in platforms) {
      tokens = tokens.concat(otherUser.data()[`${platform}_tokens`]);
    }

    try {
      sendNotification({
        tokens: tokens,
        title: `${user.data()['displayName']} has messaged you!`,
        body: text,
        data: {
          type: 'message',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          userDisplayName: user.data()['displayName'],
          userPhotoUrl: user.data()['photoUrl'],
        },
        image: user.data()['photoUrl'],
      });
    } finally {
      return 'Message sent';
    }
  }
}
