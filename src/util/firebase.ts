import admin from 'firebase-admin';
import { ConfigModule } from '@nestjs/config';
import { logo } from './constants';

ConfigModule.forRoot();

const pk =
  '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCTbHzMA6i402jE\nlwgF3+28jYtNecx4Qzueq6vyvP8S9xGZHAsBMa3fc0PThlBvriPvvkrTa30AQ7q5\nRbREr2jq6RAsycWMc1WSgux7gyaGTL9xfVYZeY9SFPTk0O6k+cEGHqa7CGPB2KkU\np/NbpHUO/z7TpMXALcObTmertSB94jrB3/Dgf4tUt4je7p9HGIIJgLQF9e2pQrZA\nSbkMCbjj3eDPB74V3M4xPbZShnSxbcq20qQVZhTi9Mvu+1skTMTAr0sioOc7eNto\nScspLtNffGWLEzphhPrrG28TAIYO0OlJq62S2m91sJ49f2l2iTAcQewBVt2xS+eN\nTY0FUuW5AgMBAAECgf8ncDgxbEVtXFh5UobRblJKmBbag6py5JcM/36xGQDTAAs1\n6o38n9vlYvITARdwJ1dR2pBly99SiCFGSb2+mTRmJ0WbQnQb+sS4R75dKH5Yx42j\n6a9lPDTL0RRFR7d5e2j6/j+oVhP9A4jHvXvBSMjcmgescuRQNccJddOwZR94/xe9\nWE4AM2GtMjKDhmlrRVcH1Um78WpWdOD1u0ogzyclCthIzSPmw6XCyTol7OEsECiJ\nAqa6Yh2QY3Gw3VwmyAAoy+/nK3qFlpDfp9hWSXwUueM21K9INCWv55qLPzTc4NHg\nZ1AfNn75PbvZio0cz4AMhqQksvsY/GSdXLx6wiUCgYEAxSlx+MpWZOC/iAgllu8Z\nGqv3b5YyxBVMMvuRAFkqXuD3Ktc++Ypivaunbcn0/sx+5VwKDWnxfXFvxEBR8fFb\nNRSB2l/ylG9qIe/GeGPKZrYyszwXWQhl+qvHyoylFv1R15kB4CrtS3fTPVFQG8Cc\nYdB9JyOtEoDFWZANMuz8U28CgYEAv2s0gkgUSaWjnXS7j5/bS8nFzvCi81JhoBjM\nEy0MnzHvVzr4aKR93v3xrh8X3DSbk77GCI2pnjhlbyHd/YttxK+aLplLRWmzhn6S\nFLHWMX0FTj0r9NGXnU1+mmNZi/59WRrELZeVGMIZVz+lF/CqUC//FzlF+geeeLRN\nSuz0pVcCgYEAwTGdZmYORgccZtVk0AM2HDaJ3SPWVuFvqz1qlmbI5/OU/ruwD6GU\no7qB80jD8rC7X0/S4dYANiVjmXBVW7he4SJZI3yFHQIXg22KkwllmUPLZmnpjup1\n0y1kNouecWqEObjKZ7hokVy29wyobKlOE2LSX/nLa6gWuW44IMCrd60CgYAfWUJP\nN9jCuvLRvaVd/zMd9VyE6Jn3OX2th4Icfds8UyQ8Z/b4xD+s/m/PMV5p/N+h0bOD\nARhPRjMugSBm/qeqd4vLp+VQ59+z3hS0eO94SV5OEuyY+p5W77MVO8IVkEcdCaop\nQVL0rA0UYeL6ybpKyaGAPyv7p7XHVNf3tljWnwKBgBPGD2G3DysBKLPnpRbWsyMg\nkGtu4J5ESvXMX0CCAyvVp8mCZIai1sztlW6qeAIenYpHGU5gDGukyjHCoaclelmJ\n22gzD28R9NufCQtcQS4Vtpy/mV+s3AK+Ou9qMfdfWMI5nljo26bWjOucBjxxdAKw\n3MuvW3ZguBrXisxfIQwD\n-----END PRIVATE KEY-----\n';

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.projectId,
    privateKey: pk, // process.env.privateKey,
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
