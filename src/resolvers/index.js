import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLUpload } from 'graphql-upload';
import userResolvers from './user';
import uploadResolvers from './upload';
import alertResolvers from './alert';
import postResolvers from './post';
import statsResolvers from './stats';
import commentResolvers from './comment';
import locationResolvers from './location';
const customScalarResolver = {
  Date: GraphQLDateTime,
  Upload: GraphQLUpload,
};

export default [
  customScalarResolver,
  userResolvers,
  uploadResolvers,
  alertResolvers,
  postResolvers,
  statsResolvers,
  commentResolvers,
  locationResolvers,
];
