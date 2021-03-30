import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
// import pubsub, { EVENTS } from '../subscription';
import {
  isAuthenticated,
  isVerified,
  isJobOwner,
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
    jobs: async (
      parent,
      { key, filter, cursor, limit = 20, cache },
      { redis, models },
      info,
    ) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const jobCount = await models.Job.countDocuments({
          status: 'published',
        }).maxTimeMS(100);

        if (!jobCount) throw new Error('NOCOUNT');

        let results;

        if (
          filter &&
          JSON.stringify(filter) !== JSON.stringify(INITIAL_STATE)
        ) {
          results = await models.Job.search(
            filter || INITIAL_STATE,
            limit,
            cursor,
          );
        } else {
          results = await models.Job.paginate(
            { status: 'published' },
            {
              sort: { featured: -1, publishedAt: -1 },
              select:
                'id title parent slug tags types location status publishedAt featured',
              populate: 'parent',
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
    job: async (parent, { slug, cache }, { models }, info) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const job = await models.Job.findOne({
          slug: slug,
        })
          .populate('parent')
          .lean();

        return job;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
    location: async (parent, { location }, { models }) => {
      try {
        const cityTag = location.split(',')[0];
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
    createJob: combineResolvers(
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

          const parent = await models.Company.findOne({
            userId: me.id,
          });

          const job = await models.Job.create({
            ...input,
            parent: input.parent,
            parentName: input.parent.title,
            publishedAt:
              input.status === 'published' ? new Date() : null,
            slug: generateSlug(input.title),
            userId: me.id,
          });

          parent.jobs.push(job);
          parent.save();

          return await job;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    updateJob: combineResolvers(
      isAuthenticated,
      isVerified,
      isJobOwner,
      async (parent, args, context, info) => {
        try {
          const { id, input } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          const job = await models.Job.findOneAndUpdate(
            { _id: id },
            {
              ...input,
            },
            { new: true },
          ).populate('parent');

          if (input.status === 'published' && !job.publishedAt) {
            job.publishedAt = new Date();
            job.save();
          }

          console.log(job);
          return await job;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    setJobStatus: combineResolvers(
      isAuthenticated,
      isVerified,
      isJobOwner,
      async (parent, args, context, info) => {
        try {
          const { id, status } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);
          const job = await models.Job.findByIdAndUpdate(
            id,
            {
              status: status,
            },
            { new: true },
          );

          if (job) {
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

    deleteJob: combineResolvers(
      isAuthenticated,
      isJobOwner,
      async (parent, { id }, { models }) => {
        try {
          const job = await models.Job.findById(id);

          const company = await models.Company.findByIdAndUpdate(
            job.parent,
            {
              $pull: { children: job.id },
            },
          );

          if (job && company) {
            await job.remove();
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

  Job: {
    id: (parent, args, { models }) => parent._id,
  },
};
