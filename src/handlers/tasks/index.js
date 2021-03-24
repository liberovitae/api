import models from '../../models';
import { createEmail } from '../email';
import { config } from 'dotenv';
import { triggerPushMsg } from '../pushNotifications';
import searchJobs from './jobs';
import searchVenues from './venues';

const env = process.env.NODE_ENV;
config({ path: `./.env.${env}` });

export const TaskHandler = async ({ input }) => {
  try {
    const task = await models.Task.findById(input._id)
      .populate('user')
      .populate('alert')
      .populate('job')
      .populate('venue');

    const { job, venue, user } = task;

    if (task) {
      if (task.type === 'reminder') {
        const email = await createEmail();
        let itemType;

        if (job) itemType = 'job';
        if (venue) itemType = 'venue';

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
              item: job || venue,
              type: itemType,
              location: job.company.name || venue.location.name,
            },
          })
          .then(() => {
            console.log('email has been sent!');
            task.remove();
          });
      }

      if (task.type === 'alert') {
        const { alert } = task;
        const {
          keywords,
          types,
          regions,
          location,
          alertType,
        } = alert;

        let items;

        let keywordsQuery;
        let typesQuery;
        let regionsQuery;
        let locationQuery;

        keywords.length
          ? (keywordsQuery = {
              $or: [
                {
                  $text: { $search: `"${keywords}"` },
                },
              ],
            })
          : null;

        types.length
          ? (typesQuery = {
              types: {
                $not: {
                  $elemMatch: {
                    $nin: types,
                  },
                },
              },
            })
          : null;

        regions.length
          ? (regionsQuery = {
              regions: {
                $not: {
                  $elemMatch: {
                    $nin: regions,
                  },
                },
              },
            })
          : null;

        location.length
          ? (locationQuery = {
              'location.name': {
                $regex: location.name,
                $options: 'i',
              },
            })
          : null;

        if (alertType === 'job') {
          items = await searchJobs({
            keywordsQuery,
            typesQuery,
            regionsQuery,
            locationQuery,
            task,
          });
        }

        if (alertType === 'venue') {
          items = await searchVenues({
            keywordsQuery,
            typesQuery,
            regionsQuery,
            locationQuery,
            task,
          });
        }

        if (items && items.length) {
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

          console;

          if (alert.email) {
            const email = await createEmail();
            email
              .send({
                template: 'items',
                message: {
                  from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
                  to: user.email,
                },
                locals: {
                  sitename: process.env.SITE_NAME,
                  hostname: process.env.HOSTNAME,
                  username: user.username,
                  items: items,
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
