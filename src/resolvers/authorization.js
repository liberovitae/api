import { ForbiddenError } from 'apollo-server';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { me }) =>
  me ? skip : new ForbiddenError('Not authenticated as user.');

export const isVerified = (parent, args, { me }) => {
  if (args.status === 'filled' || args.status === 'published')
    return me.verified
      ? skip
      : new ForbiddenError('Email address not verified');
};

export const isAdmin = combineResolvers(
  isAuthenticated,
  (parent, args, { me: { role } }) => {
    console.log('ADMIN', role);
    return role === 'ADMIN'
      ? skip
      : new ForbiddenError('Not authorized as admin.');
  },
);

export const isPostOwner = async (parent, { id }, { models, me }) => {
  const post = await models.Post.findById(id).lean();

  if (post.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isCommentOwner = async (
  parent,
  { id },
  { models, me },
) => {
  const comment = await models.Comment.findById(id).lean();

  if (comment.author.id != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};
