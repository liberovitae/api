import { gql } from 'apollo-server-express';

import userSchema from './user';
import jobSchema from './job';
import companySchema from './company';
import uploadSchema from './upload';
import alertSchema from './alert';
import locationSchema from './location';
import blogSchema from './blog';
import venueSchema from './venue';
import statsSchema from './stats';

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
  jobSchema,
  companySchema,
  uploadSchema,
  alertSchema,
  locationSchema,
  blogSchema,
  venueSchema,
  statsSchema,
];
