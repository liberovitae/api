import { gql } from 'apollo-server-express';

export default gql`
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    path: String
  }

  extend type Query {
    files: [String]
  }
  extend type Mutation {
    uploadFile(file: Upload!): String!
  }
`;
