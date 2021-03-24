import { combineResolvers } from 'graphql-resolvers';
import { ApolloError } from 'apollo-server';
import { isAuthenticated, isAdmin } from './authorization';
import generateSlug from '../handlers/generateSlug';

export default {
  Query: {
    blog: async (parent, { slug }, { models, me }) => {
      try {
        const blog = await models.Blog.findOne({ slug: slug });
        return blog;
      } catch (err) {
        console.log(err);
      }
    },
    blogs: async (parent, { id }, { models, me }) => {
      try {
        return await models.Blog.find({ status: 'published' }).sort({
          publishedAt: -1,
        });
      } catch (err) {
        console.log(err);
      }
    },
    allBlogs: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, { id }, { models, me }) => {
        try {
          return await models.Blog.find({}).sort({
            createdAt: -1,
          });
        } catch (err) {
          console.log(err);
        }
      },
    ),
  },

  Mutation: {
    createBlog: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, { input }, { models, me }) => {
        try {
          const blog = await models.Blog.create({
            ...input,
            slug: generateSlug(input.title),
            userId: me.id,
          });

          return blog;
        } catch (err) {
          console.log(err);

          if (err.code === 11000) {
            throw new ApolloError('Duplicate error');
          }
        }
      },
    ),

    deleteBlog: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, { id }, { models }) => {
        try {
          const blog = await models.Blog.findById(id);

          if (blog) {
            await blog.remove();
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),

    updateBlog: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, { input }, { models }) => {
        try {
          const blog = await models.Blog.findByIdAndUpdate(input.id, {
            ...input,
          });

          if (blog) {
            return blog;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),
    setBlogStatus: combineResolvers(
      isAuthenticated,
      isAdmin,
      async (parent, args, context, info) => {
        try {
          const { id, status } = args;
          const { models } = context;
          const errorMessage = await rateLimiter(
            { parent, args, context, info },
            { max: 5, window: '10s' },
          );

          if (errorMessage) throw new Error(errorMessage);
          const blog = await models.Blog.findByIdAndUpdate(
            id,
            {
              status: status,
            },
            { new: true },
          );

          if (blog) {
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

  Blog: {
    id: (parent, args, { models }) => parent._id,
  },
};
