import models from '../../models';
import { createEmail } from '../email';
import { config } from 'dotenv';
import { triggerPushMsg } from '../pushNotifications';

const env = process.env.NODE_ENV;
config({ path: `./.env.${env}` });

export const TaskHandler = async ({ input }) => {
  try {
    const task = await models.Task.findById(input._id)
      .populate('user')
      .populate('alert')
      .populate('post');

    const { post, user } = task;

    if (task) {
      if (task.type === 'reminder') {
        const email = await createEmail();

        return email
          .send({
            template: 'reminder',
            message: {
              from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
              to: user.email,
            },
            locals: {
              sitename: process.env.SITE_NAME,
              hostname: process.env.HOSTNAME,
              username: user.username,
              post: post,
              location: post.location.name,
            },
          })
          .then(() => {
            console.log('email has been sent!');
            task.remove();
          });
      }

      if (task.type === 'alert') {
        const { alert } = task;
        const { keywords, types, location, alertType, dates } = alert;

        const posts = await models.Post.search({
          keywords,
          types,
          location,
          dates,
          type: alertType,
        });

        if (posts && posts.length) {
          if (alert.notification && user.subscription) {
            triggerPushMsg(
              user.subscription,
              JSON.stringify({
                title: `${items.length} New ${type}s found @ ${process.env.SITE_NAME}`,
                image: `${process.env.HOSTNAME}/favicon.svg`,
                url: `${process.env.HOSTNAME}/alert/${alert.slug}`,
                text: `There are ${items.length} new ${alertType}s at ${process.env.SITE_NAME} matching your alert "${alert.name}"`,
              }),
            );
          }

          if (alert.email) {
            const email = await createEmail();
            email
              .send({
                template: 'posts',
                message: {
                  from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
                  to: user.email,
                },
                locals: {
                  sitename: process.env.SITE_NAME,
                  hostname: process.env.HOSTNAME,
                  username: user.username,
                  posts: posts,
                  type: alertType,
                  alert: alert,
                },
              })
              .then(() => console.log('email has been sent!'));
          }
        }

        task.updatedAt = Date.now(); // Renew updatedAt for next tick/cycle
        task.save();
      }
    }
  } catch (err) {
    console.log(err);
  }
};
