import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
// import pubsub, { EVENTS } from '../subscription';
import {
  isAuthenticated,
  isVerified,
  isEventOwner,
} from './authorization';
import { ApolloError } from 'apollo-server';
import INITIAL_STATE from '../constants/initialSearchFilter';
import cities from 'all-the-cities';
import generateSlug from '../handlers/generateSlug';

const rateLimiter = getGraphQLRateLimiter({
  identifyContext: (ctx) => ctx.id,
});

export default {
  Query: {
    events: async (
      parent,
      { key, filter, cursor, limit = 20, cache },
      { redis, models },
      info,
    ) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const eventCount = await models.Event.countDocuments({
          status: 'published',
        }).maxTimeMS(100);

        if (!eventCount) throw new Error('NOCOUNT');

        let results;

        if (
          filter &&
          JSON.stringify(filter) !== JSON.stringify(INITIAL_STATE)
        ) {
          results = await models.Event.search(
            filter || INITIAL_STATE,
            limit,
            cursor,
          );
        } else {
          results = await models.Event.paginate(
            { status: 'published' },
            {
              sort: { featured: -1, publishedAt: -1 },
              populate: 'parent',
              select:
                'id title dates slug parent image tags types location status publishedAt featured',
              limit: limit,
              page: cursor || 1,
              lean: true,
              collation: {
                locale: 'en',
                strength: 2,
              },
            },
          );
        }

        if (results) {
          const { docs, hasNextPage, nextPage, totalDocs } = results;
          const edges = docs;
          return {
            edges,
            pageInfo: {
              hasNextPage,
              nextPage,
              totalDocs,
            },
          };
        }
      } catch (err) {
        console.error(err);
        throw new ApolloError(err);
      }
    },
    event: async (parent, { slug, cache }, { models }, info) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const event = await models.Event.findOne({
          slug: slug,
        })
          .populate('parent')
          .lean();
        return event;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
    location: async (parent, { location }, { models }) => {
      try {
        const cityTag = location.split(',')[0];
        // const country = location.split(',').pop();
        const foundCities = cities.filter((city) =>
          city.name.match(new RegExp(cityTag, 'i')),
        );
        return foundCities;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },

  Mutation: {
    createEvent: combineResolvers(
      isAuthenticated,
      async (parent, args, context, info) => {
        try {
          const { input } = args;
          const { models, me } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 10, window: '60s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          if (input.status === 'published' && !me.verified)
            throw new ApolloError('Not verified');

          const event = await models.Event.create({
            ...input,
            publishedAt:
              input.status === 'published' ? new Date() : null,
            slug: generateSlug(input.title),
            userId: me.id,
          });

          const venue = await models.Venue.findByIdAndUpdate(
            input.parent,
            {
              $addToSet: { children: event.id },
            },
          );

          if (event && venue) return event;
          return false;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    updateEvent: combineResolvers(
      isAuthenticated,
      isVerified,
      async (parent, args, context, info) => {
        try {
          const { id, input } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          const event = await models.Event.findOneAndUpdate(
            { _id: id },
            {
              ...input,
            },
            { new: true },
          );

          if (input.status === 'published' && !event.publishedAt) {
            event.publishedAt = new Date();
            event.save();
          }

          return await event;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    setEventStatus: combineResolvers(
      isAuthenticated,
      isVerified,
      async (parent, args, context, info) => {
        try {
          const { id, status } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);
          const event = await models.Event.findByIdAndUpdate(
            id,
            {
              status: status,
            },
            { new: true },
          );

          if (event) {
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

    deleteEvent: combineResolvers(
      isAuthenticated,
      isEventOwner,
      async (parent, { id }, { models }) => {
        try {
          const event = await models.Event.findById(id);

          const venue = await models.Venue.findByIdAndUpdate(
            event.parent,
            {
              $pull: { children: event.id },
            },
          );

          if (event && venue) {
            await event.remove();
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
  },

  Event: {
    id: (parent, args, { models }) => parent._id,
  },
};
