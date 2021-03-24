import webpush from 'web-push';
import { config } from 'dotenv';

const env = process.env.NODE_ENV;
config({ path: `./.env.${env}` });

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export const triggerPushMsg = (subscription, dataToSend) => {
  webpush
    .sendNotification(subscription, dataToSend)
    .then((push) => console.log(push))
    .catch((err) => {
      if (err.statusCode === 410) {
        // return deleteSubscriptionFromDatabase(subscription._id);
      } else {
        console.log('Subscription is no longer valid: ', err);
      }
    });
};
