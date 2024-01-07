import admin from 'firebase-admin';
import { ConfigModule } from '@nestjs/config';

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
