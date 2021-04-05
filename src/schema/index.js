import { gql } from 'apollo-server-express';
import userSchema from './user';
import uploadSchema from './upload';
import alertSchema from './alert';
import locationSchema from './location';
import postSchema from './post';
import statsSchema from './stats';
import commentSchema from './comment';

const linkSchema = gql`
  scalar Date
  scalar Upload

  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  # type Subscription {
  #   _: Boolean
  # }
`;

export default [
  linkSchema,
  userSchema,
  uploadSchema,
  alertSchema,
  locationSchema,
  postSchema,
  statsSchema,
  commentSchema,
];
