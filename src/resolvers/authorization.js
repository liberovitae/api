import { ForbiddenError } from 'apollo-server';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { me }) =>
  me ? skip : new ForbiddenError('Not authenticated as user.');

export const isVerified = (parent, args, { me }) => {
  if (
    // FIXME: arg inputs should be consistent
    args.status === 'filled' ||
    args.status === 'published' ||
    args.input.status === 'published'
  )
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

export const isMessageOwner = async (
  parent,
  { id },
  { models, me },
) => {
  const message = await models.Message.findById(id).lean();

  if (message.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isJobOwner = async (parent, { id }, { models, me }) => {
  const job = await models.Job.findById(id).lean();

  if (job.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isVenueOwner = async (
  parent,
  { id },
  { models, me },
) => {
  const venue = await models.Venue.findById(id).lean();

  if (venue.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isEventOwner = async (
  parent,
  { id },
  { models, me },
) => {
  const event = await models.Event.findById(id)
    .populate('parent')
    .lean();

  console.log('event', event);
  console.log(me);

  if (event.parent.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isOwner = async (parent, { id }, { models, me }) => {
  const user = await models.User.findById(me.id).lean();
  if (user.id != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};

export const isCompanyOwner = async (
  parent,
  { id },
  { models, me },
) => {
  const company = await models.Company.findById(id).lean();

  if (company.userId != me.id) {
    throw new ForbiddenError('Not authenticated as owner.');
  }

  return skip;
};
