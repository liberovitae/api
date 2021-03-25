import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLUpload } from 'graphql-upload';
import userResolvers from './user';
import jobResolvers from './job';
import companyResolvers from './company';
import uploadResolvers from './upload';
import alertResolvers from './alert';
import blogResolvers from './blog';
import venueResolvers from './venue';
import eventResolvers from './event';
import statsResolvers from './stats';

const customScalarResolver = {
  Date: GraphQLDateTime,
  Upload: GraphQLUpload,
};

export default [
  customScalarResolver,
  userResolvers,
  jobResolvers,
  companyResolvers,
  uploadResolvers,
  alertResolvers,
  blogResolvers,
  venueResolvers,
  eventResolvers,
  statsResolvers,
];
