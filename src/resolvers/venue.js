import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
// import pubsub, { EVENTS } from '../subscription';
import {
  isAuthenticated,
  isVerified,
  isVenueOwner,
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
    venues: async (
      parent,
      { key, filter, cursor, limit = 20, cache },
      { redis, models },
      info,
    ) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const venueCount = await models.Venue.countDocuments({
          status: 'published',
        }).maxTimeMS(100);

        if (!venueCount) throw new Error('NOCOUNT');

        let results;

        if (
          filter &&
          JSON.stringify(filter) !== JSON.stringify(INITIAL_STATE)
        ) {
          results = await models.Venue.search(
            filter || INITIAL_STATE,
            limit,
            cursor,
          );
        } else {
          results = await models.Venue.paginate(
            { status: 'published' },
            {
              sort: { featured: -1, publishedAt: -1 },
              select:
                'id title slug logo tags types location status publishedAt featured',
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
    venue: async (parent, { slug, cache }, { models }, info) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const venue = await models.Venue.findOne({
          slug: slug,
        }).lean();
        return venue;
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
    createVenue: combineResolvers(
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

          const venue = await models.Venue.create({
            ...input,
            publishedAt:
              input.status === 'published' ? new Date() : null,
            slug: generateSlug(input.title),
            userId: me.id,
          });

          const user = await models.User.findByIdAndUpdate(me.id, {
            $addToSet: { venues: venue.id },
          });

          return await venue;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    updateVenue: combineResolvers(
      isAuthenticated,
      isVerified,
      isVenueOwner,
      async (parent, args, context, info) => {
        try {
          const { id, input } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          const venue = await models.Venue.findOneAndUpdate(
            { _id: id },
            {
              ...input,
            },
            { new: true },
          );

          if (input.status === 'published' && !venue.publishedAt) {
            venue.publishedAt = new Date();
            venue.save();
          }

          return await venue;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    setVenueStatus: combineResolvers(
      isAuthenticated,
      isVerified,
      isVenueOwner,
      async (parent, args, context, info) => {
        try {
          const { id, status } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);
          const venue = await models.Venue.findByIdAndUpdate(
            id,
            {
              status: status,
            },
            { new: true },
          );

          if (venue) {
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

    deleteVenue: combineResolvers(
      isAuthenticated,
      isVenueOwner,
      async (parent, { id }, { models }) => {
        try {
          const venue = await models.Venue.findById(id);

          if (venue) {
            await venue.remove();
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

  Venue: {
    id: (parent, args, { models }) => parent._id,
  },
};
