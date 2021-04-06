import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';
// import pubsub, { EVENTS } from '../subscription';
import {
  isAuthenticated,
  isVerified,
  isCommentOwner,
} from './authorization';
import { ApolloError } from 'apollo-server';
import { buildComment } from '../handlers/comments';

const rateLimiter = getGraphQLRateLimiter({
  identifyContext: (ctx) => ctx.id,
});

export default {
  Query: {
    comments: async (
      parent,
      { key, postId, filter, cursor, limit = 20, cache },
      { redis, models },
      info,
    ) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 0 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const commentCount = await models.Comment.countDocuments({
          postId: postId,
        }).maxTimeMS(100);

        if (!commentCount) throw new Error('NOCOUNT');

        const results = await models.Comment.paginate(
          { postId: postId, depth: 0 },
          {
            sort: { createdAt: -1 },
            select:
              'id text author depth createdAt slug postId parentId children deleted',
            populate: {
              path: 'author',
            },
            limit: limit,
            page: cursor || 1,
            lean: true,
            collation: {
              locale: 'en',
              strength: 2,
            },
          },
        );

        if (results) {
          const { docs, hasNextPage, nextPage } = results;
          const edges = docs;

          console.log(edges);

          return {
            edges,
            pageInfo: {
              hasNextPage,
              nextPage,
              totalDocs: commentCount,
            },
          };
        }
      } catch (err) {
        console.error(err);
        throw new ApolloError(err);
      }
    },
    comment: async (parent, { slug, cache }, { models }, info) => {
      try {
        cache
          ? info.cacheControl.setCacheHint({ maxAge: 60 })
          : info.cacheControl.setCacheHint({ maxAge: 0 });
        const comment = await models.Comment.findOne({
          slug: slug,
        }).lean();
        return comment;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },

  Mutation: {
    createComment: combineResolvers(
      isAuthenticated,
      async (parent, args, context, info) => {
        try {
          const { input, postId, parentId } = args;
          const { me, models } = context;

          if (!input.text) {
            error.message = 'Cant be empty';
            return ApolloError(error.message);
          }
          // Populate author info from currently logged in user
          input.author = {
            id: me.id,
            username: me.username,
          };
          // Get user account
          //   const user = await models.User.findById(me.id);

          let parent = null;
          //   let parentUser = null;
          if (parentId) {
            parent = await models.Comment.findOne({
              _id: parentId,
            });
          }

          //   if (parent) {
          //     parentUser = await models.User.findOne({
          //       _id: parent.author.id,
          //     }).populate('subscriptions');
          //   }

          //   const post = await models.Post.findById(input.post_id);

          const comment = await buildComment(
            input,
            me,
            postId,
            parentId,
          );

          //   await updateUser(user, comment);
          //   await updatePost(post, comment);

          const post = await models.Post.findByIdAndUpdate(postId, {
            $addToSet: {
              comments: comment.id,
            },
            $inc: {
              commentCount: 1,
            },
          });

          //   if (parentUser) {
          //     const subs = await getUserSubscriptions(
          //       parentUser.subscriptions,
          //     );
          //     createNotification({
          //       type: 'reply',
          //       parentUser,
          //       user,
          //       link: comment.permalink,
          //       text: parent.text,
          //       parent,
          //       post,
          //     });
          //     sendNotifications(subs, comment);
          //   }

          comment.updatedAt = null;

          await models.Comment.findOneAndUpdate(
            { _id: parentId },
            { $push: { children: comment.id } },
          );

          console.log(post);

          if (comment && post) {
            return comment;
          } else {
            return false;
          }
        } catch (err) {
          // console.error(err);
          return new ApolloError(err);
        }
      },
    ),

    updateComment: combineResolvers(
      isAuthenticated,
      isVerified,
      isCommentOwner,
      async (parent, args, context, info) => {
        try {
          const { id, input } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);

          const comment = await models.Comment.findOneAndUpdate(
            { _id: id },
            {
              ...input,
            },
            { new: true },
          );

          if (input.status === 'published' && !comment.publishedAt) {
            comment.publishedAt = new Date();
            comment.save();
          }

          return await comment;
        } catch (err) {
          console.log(err);
          throw new ApolloError(err);
        }
      },
    ),

    deleteComment: combineResolvers(
      isAuthenticated,
      isCommentOwner,
      async (parent, { id }, { models, me }) => {
        try {
          const comment = await models.Comment.findById(id);

          // const post = await models.Post.findByIdAndUpdate(
          //   comment.postId,
          //   {
          //     $pull: {
          //       comments: comment.id,
          //     },
          //     $inc: {
          //       commentCount: -1,
          //     },
          //   },
          // );

          if (comment.deleted)
            throw new ApolloError('Comment deleted');

          if (comment) {
            comment.text = 'Deleted';
            comment.delete(me.id);
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

  Comment: {
    id: (parent, args, { models }) => parent._id,
  },
};
