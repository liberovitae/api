import { combineResolvers } from 'graphql-resolvers';
import { ApolloError } from 'apollo-server';
import { isAuthenticated } from './authorization';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
import generateSlug from '../handlers/generateSlug';

const rateLimiter = getGraphQLRateLimiter({
  identifyContext: (ctx) => ctx.id,
});

export default {
  Query: {
    alerts: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }
          const user = await models.User.findById(me.id).populate({
            path: 'alerts',
          });

          return user.alerts;
        } catch (err) {
          console.log(err);
        }
      },
    ),

    alert: combineResolvers(
      isAuthenticated,
      async (parent, { slug }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }

          const alert = await models.Alert.findOne({
            slug: slug,
          });

          return alert;
        } catch (err) {
          console.log(err);
        }
      },
    ),
  },

  Mutation: {
    createAlert: combineResolvers(
      isAuthenticated,
      async (parent, { input }, { models, me }) => {
        try {
          const alert = await models.Alert.create({
            userId: me.id,
            slug: generateSlug(),
            ...input,
          });

          const user = await models.User.findByIdAndUpdate(me.id, {
            $addToSet: { [`alerts.${alert.alertType}s`]: alert.id },
          });

          // Add web-push subscription to user
          if (input.subscription) {
            user.subscription = input.subscription;
            user.save();
          }

          if (alert.active) {
            const task = await models.Task.create({
              user: me.id,
              type: 'alert',
              sleepUntil: Date.now(),
              //Here we set the task interval to weekly(Every Monday at 8) or daily(Every day at 8)
              // Improve this to accomodate user timezone
              interval:
                input.frequency === 'daily'
                  ? '0 8 * * *'
                  : '0 8 * * 1',
              alert: alert.id,
            });

            alert.task = task.id;
            alert.save();
          }

          if (user && alert) {
            return alert;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),

    updateAlert: combineResolvers(
      isAuthenticated,
      async (parent, args, context, info) => {
        try {
          const { id, input } = args;
          const { models, me } = context;

          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '60s' },
          );

          if (errorMessage) throw new ApolloError(errorMessage);

          const alert = await models.Alert.findByIdAndUpdate(
            id,
            { ...input },
            { new: true },
          );

          // Add web-push subscription to user
          input.subscription &&
            (await models.User.findByIdAndUpdate(me.id, {
              subscription: input.subscription,
            }));

          // Create a new task if activated or remove if inactive
          if (alert.active) {
            alert.task &&
              (await models.Task.findByIdAndDelete(alert.task)); // Delete and recreate task instead of editing existing one.

            const task = await models.Task.create({
              user: me.id,
              type: 'alert',
              sleepUntil: Date.now(),

              interval:
                // Here we set the task interval to weekly(Every Monday at 8) or daily(Every day at 8)
                // Improve this to accomodate user timezone
                input.frequency === 'daily'
                  ? '0 8 * * *'
                  : '0 8 * * 1',
              alert: alert.id,
            });
            alert.task = task.id;
            alert.save();
          } else {
            await models.Task.findByIdAndDelete(alert.task);
            alert.task = null;
            alert.save();
          }

          return await alert;
        } catch (err) {
          console.log(err);
        }
      },
    ),

    toggleActivate: combineResolvers(
      isAuthenticated,
      async (parent, args, context, info) => {
        try {
          const { id } = args;
          const { models, me } = context;

          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '60s' },
          );

          if (errorMessage) throw new ApolloError(errorMessage);

          const alert = await models.Alert.findById(
            id,
            (err, alert) => {
              if (err) console.log(err);
              alert.active = !alert.active;
              alert.save();
            },
          );

          if (alert) {
            return alert.active;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),

    deleteAlert: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          const alert = await models.Alert.findById(id);

          const { alertType } = alert;

          const user = await models.User.findByIdAndUpdate(me.id, {
            $pull: { [`alerts.${alertType}s`]: id },
          });

          if (alert.task) {
            await models.Task.findByIdAndDelete(alert.task);
          }

          alert.delete();

          if (alert && user) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),
  },
};
