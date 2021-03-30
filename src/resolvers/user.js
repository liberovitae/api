import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import {
  AuthenticationError,
  UserInputError,
  ApolloError,
} from 'apollo-server';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated, isAdmin } from './authorization';
import moment from 'moment';
import {
  VerifyEmail,
  ResetPassword,
  ChangeEmail,
} from '../handlers/email';
import nearbyCities from 'nearby-cities';

const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role, verified } = user;
  return jwt.sign({ id, email, username, role, verified }, secret, {
    expiresIn,
  });
};

function compareValues(key, order = 'asc') {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA =
      typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
    const varB =
      typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order === 'desc' ? comparison * -1 : comparison;
  };
}

export default {
  Query: {
    users: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, args, { models }) => {
        try {
          const { limit } = args;
          return await models.User.find().limit(limit).lean();
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),
    user: async (parent, { id }, { models }) => {
      try {
        return await models.User.findById(id).lean();
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
    me: async (parent, args, { models, me }) => {
      try {
        if (!me) {
          return null;
        }
        const user = await models.User.findById(me.id)
          .populate('company venues')
          .lean();

        return user;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
    meCounts: combineResolvers(
      isAuthenticated,
      async (parent, args, { models, me }) => {
        try {
          if (!me) {
            return false;
          }

          const user = await models.User.findById(me.id)
            .populate('company')
            .lean();

          if (user) {
            return {
              jobs: user.company ? user.company.jobs.length : 0,
              venues: user.venues ? user.venues.length : 0,
              saved: {
                jobs: user.saved?.jobs ? user.saved.jobs.length : 0,
                venues: user.saved?.venues
                  ? user.saved.venues.length
                  : 0,
              },
              alerts: {
                jobs: user.alerts?.jobs ? user.alerts.jobs.length : 0,
                venues: user.alerts?.venues
                  ? user.alerts.venues.length
                  : 0,
              },
            };
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),
    meJobs: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }
          const meJobs = await models.Job.find({
            userId: me.id,
          })
            .populate('company')
            .sort({ createdAt: -1 })
            .lean();

          return meJobs;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),
    meVenues: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }
          const meVenues = await models.Venue.find({
            userId: me.id,
          })
            .populate('children')
            .sort({ createdAt: -1 })
            .lean();

          console.log(meVenues);

          return meVenues;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),
    meEvents: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }
          const meEvents = await models.Event.find({
            userId: me.id,
          })
            // .populate('parent')
            .sort({ createdAt: -1 })
            .lean();

          return meEvents;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    savedItems: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (!me) {
            return null;
          }
          const user = await models.User.findById(me.id)
            .populate({
              path: 'saved',
              populate: {
                path: 'jobs',
                options: { sort: { createdAt: -1 } },
                populate: {
                  path: 'job',
                  populate: {
                    path: 'parent',
                  },
                },
              },
            })
            .populate({
              path: 'saved',
              populate: {
                path: 'venues',
                options: { sort: { createdAt: -1 } },
                populate: {
                  path: 'venue',
                },
              },
              populate: {
                path: 'events',
                options: { sort: { createdAt: -1 } },
                populate: {
                  path: 'event',
                },
              },
            })
            .lean();

          return user.saved;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),
    nearestCity: async (parent, { lat, lon }, { models }) => {
      try {
        const query = {
          latitude: lat,
          longitude: lon,
        };
        const cities = nearbyCities(query);

        const nearestBigCity = cities
          .slice(0, 19)
          .sort(compareValues('population', 'desc'))[0];

        return nearestBigCity;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password },
      { models, secret },
    ) => {
      try {
        const registrationToken = {
          token: uuidv4(),
          created_at: new Date(),
          expireAfterSeconds: 3600000 * 6 * 6, // Three days to coincide with our autodeletion
        };

        const user = await models.User.create({
          username,
          email,
          password,
          verification_token: registrationToken,
        });

        // Send verification email to user
        VerifyEmail({
          userEmail: user.email,
          token: registrationToken.token,
        });

        return { token: createToken(user, secret, '7d') };
      } catch (err) {
        if (err.code === 11000) {
          console.log(err);
          throw new ApolloError('Username/email already exists.');
        }
        throw new ApolloError(err);
      }
    },

    verifyUser: async (
      parent,
      { token, type },
      { models, secret, me },
    ) => {
      try {
        const user = await models.User.findOneAndUpdate(
          {
            'verification_token.token': token,
          },

          { verified: true, verification_token: { token: '' } },
          { new: true },
        );

        if (type === 'email') {
          user.email = user.secondaryEmail;
          user.secondaryEmail = undefined;
          user.save();
        }

        if (!user) {
          throw new ApolloError('Invalid token/not found');
        }

        return { token: createToken(user, secret, '7d') };
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      try {
        const user = await models.User.findByLogin(login);
        if (!user) {
          throw new UserInputError(
            'No user found with these login credentials.',
          );
        }

        const isValid = await user.validatePassword(password);

        if (!isValid) {
          throw new AuthenticationError('Invalid password.');
        }

        return { token: createToken(user, secret, '7d') };
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { email }, { models, me }) => {
        try {
          const registrationToken = {
            token: uuidv4(),
            created_at: new Date(),
            expireAfterSeconds: 3600000 * 6 * 6, // Three days to coincide with our autodeletion
          };

          const user = await models.User.findByIdAndUpdate(
            me.id,
            {
              verification_token: registrationToken,
              secondaryEmail: email,
            },
            { new: true },
          );

          ChangeEmail({
            userEmail: email,
            token: registrationToken.token,
          });

          return user;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    revertEmail: combineResolvers(
      isAuthenticated,
      async (parent, args, { me, models }, info) => {
        try {
          const user = await models.User.findByIdAndUpdate(
            me.id,
            { $unset: { secondaryEmail: 1 } },
            { new: true },
          );

          if (user) return true;
          return false;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    updatePassword: combineResolvers(
      isAuthenticated,
      async (
        parent,
        { oldPassword, newPassword },
        { models, me },
      ) => {
        try {
          const user = await models.User.findById(me.id);

          if (await user.validatePassword(oldPassword)) {
            user.password = newPassword;
            user.save();
            return true;
          } else {
            throw new AuthenticationError('Invalid old password.');
          }
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    saveItem: combineResolvers(
      isAuthenticated,
      async (parent, { id, itemType, reminder }, { models, me }) => {
        try {
          let reminderId;

          if (reminder) {
            reminderId = await models.Task.create({
              type: 'reminder',
              [itemType]: id,
              user: me.id,
              sleepUntil: moment().add(7, 'days').toDate(),
            });
          }

          const user = await models.User.findByIdAndUpdate(
            me.id,
            {
              $addToSet: {
                [`saved.${itemType}s`]: {
                  [itemType]: id,
                  reminder: reminderId,
                },
              }, // Use addToSet to prevent duplicates in array (FIXME)
            },
            { new: true },
          );

          if (itemType === 'job') {
            await models.Job.findByIdAndUpdate(id, {
              $inc: { 'stats.saves': 1 },
            });
          }

          if (itemType === 'venue') {
            await models.Venue.findByIdAndUpdate(id, {
              $inc: { 'stats.saves': 1 },
            });
          }

          if (user) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    deleteSavedItem: combineResolvers(
      isAuthenticated,
      async (parent, { id, itemType }, { models, me }) => {
        try {
          const { saved } = await models.User.findOne(
            { _id: me.id },
            {
              [`saved.${itemType}s`]: 1,
            },
          );

          const savedObj = Object.assign(
            ...saved[`${itemType}s`],
            {},
          );

          if (savedObj.reminder) {
            await models.Task.findByIdAndDelete(savedObj.reminder);
          }

          const user = await models.User.findByIdAndUpdate(me.id, {
            $pull: { [`saved.${itemType}s`]: { [itemType]: id } },
          });
          if (savedObj) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    deleteUser: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models, me }) => {
        try {
          if (id !== me.id) {
            return null;
          }

          const user = await models.User.findById(id);

          if (user) {
            await user.remove();
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    requestReset: async (parent, { email }, { models }) => {
      try {
        email = email.toLowerCase();

        // Check that user exists.
        const user = await models.User.findOne({
          email: email,
        });

        if (!user) throw new Error('No user found with that email.');

        // Create randomBytes that will be used as a token

        const registrationToken = {
          token: uuidv4(),
          created_at: new Date(),
          expireAfterSeconds: 3600000 * 6, // half day
        };

        // Add token and tokenExpiry to the db user
        const result = await models.User.findOneAndUpdate(
          {
            email: email,
          },
          { verification_token: registrationToken },
        );

        // Email them the token
        await ResetPassword({
          userEmail: user.email,
          token: registrationToken.token,
        });

        return true;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },

    resetPassword: async (
      parent,
      { token, password },
      { models, secret },
    ) => {
      try {
        const user = await models.User.findOne({
          'verification_token.token': token,
        });

        user.password = password;
        user.verification_token = { token: '' };
        user.save();

        if (!user) {
          throw new ApolloError('Invalid token/not found');
        }

        return true;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },

  User: {
    id: (parent, args, { models }) => parent._id,
    jobs: async (user, args, { models }) => {
      try {
        return await models.Job.find({
          userId: user.id,
        });
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },
};
