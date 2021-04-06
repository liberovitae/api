import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
// import pubsub, { EVENTS } from '../subscription';
import {
  isAuthenticated,
  isVerified,
  isPostOwner,
} from './authorization';
import { ApolloError } from 'apollo-server';
import generateSlug from '../handlers/generateSlug';

const rateLimiter = getGraphQLRateLimiter({
  identifyContext: (ctx) => ctx.id,
});

export default {
  Query: {
    posts: async (
      parent,
      { type, filter, cursor, limit = 20, cache },
      { redis, models },
      info,
    ) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });

        const postCount = await models.Post.countDocuments({
          type,
        }).maxTimeMS(100);

        if (!postCount) throw new Error('NOCOUNT');

        let results;

        if (filter) {
          results = await models.Post.search(
            filter,
            type,
            limit,
            cursor,
          );
        } else {
          results = await models.Post.paginate(
            { type, status: 'published' },
            {
              sort: { featured: -1, publishedAt: -1 },
              populate: 'parent',
              select:
                'id title type dates slug parent image tags types location status publishedAt featured',
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
    post: async (parent, { slug, cache }, { models }, info) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const post = await models.Post.findOne({
          slug,
        })
          .populate('parent')
          .populate('children')
          .populate('comments')
          .lean();
        return post;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },

  Mutation: {
    createPost: combineResolvers(
      isAuthenticated,
      async (parent, args, context, info) => {
        try {
          const { input } = args;
          const { models, me } = context;
          const errorMessage = await rateLimiter(
            { args, context, info },
            { max: 10, window: '60s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          // Handle our verification here to allow draft posts.
          if (input.status === 'published' && !me.verified)
            throw new ApolloError('Not verified');

          // Add 2 month timer for auto inactivity of jobs
          if (input.type === 'job') {
            input.sleepUntil = moment(new Date())
              .add(2, 'months')
              .toDate();
          }

          const post = await models.Post.create({
            ...input,
            publishedAt:
              input.status === 'published' ? new Date() : null,
            slug: generateSlug(input.title),
            userId: me.id,
          });

          const parent = await models.Post.findByIdAndUpdate(
            input.parent,
            {
              $addToSet: { children: post.id },
            },
          );

          const user = await models.User.findByIdAndUpdate(me.id, {
            $addToSet: { posts: post.id },
          });

          if (post && user) return post;
          return false;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    updatePost: combineResolvers(
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

          const post = await models.Post.findOneAndUpdate(
            id,
            {
              ...input,
            },
            { new: true },
          );

          if (input.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date();
            post.save();
          }

          return await post;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    setPostStatus: combineResolvers(
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
          const post = await models.Post.findByIdAndUpdate(
            id,
            {
              status,
            },
            { new: true },
          );

          if (post) {
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

    deletePost: combineResolvers(
      isAuthenticated,
      isPostOwner,
      async (parent, { id }, { models, me }) => {
        try {
          const post = await models.Post.findById(id);

          const user = await models.User.findByIdAndUpdate(
            post.userId,
            {
              $pull: { posts: post.id },
            },
          );

          const parent = await models.Post.findByIdAndUpdate(
            post.parent,
            {
              $pull: { children: post.id },
            },
          );

          if (post) {
            await post.remove();
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

  Post: {
    id: (parent, args, { models }) => parent._id,
  },
};
