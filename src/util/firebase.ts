import admin from 'firebase-admin';
import { ConfigModule } from '@nestjs/config';
import { logo } from './constants';

ConfigModule.forRoot();

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.projectId,
    privateKey: process.env.privateKey,
    clientEmail: process.env.clientEmail,
  }),
});

export const fcm = admin.messaging(app);
export const firestore = admin.firestore(app);
export const auth = admin.auth(app);

type Notification = {
  title: string;
  body: string;
  data: { [key: string]: string };
  image: string;
  tokens: string[];
};

export async function sendNotification(notification: Notification) {
  await fcm.sendEachForMulticast({
    tokens: notification.tokens,
    data: notification.data,
    android: {
      priority: 'high',
      notification: {
        title: notification.title,
        body: notification.body,
        channelId: 'max_importance_channel',
        imageUrl: notification.image,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        icon: '@drawable/ic_notification',
      },
      data: notification.data,
    },
    notification: {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.image,
    },
    webpush: {
      data: notification.data,
      fcmOptions: {
        link: 'https://tetraconnect.web.app/',
      },
      notification: {
        badge: logo,
        icon: logo,
        image: notification.image,
        data: notification.data,
        title: notification.title,
        body: notification.body,
      },
    },
  });
}
