import { gql } from 'apollo-server-express';

export default gql`
  extend type Mutation {
    updateStats(
      eventType: String!
      itemType: String!
      slug: String!
    ): Boolean!
  }

  type Stats {
    views: Int
    visits: Int
    saves: Int
  }
`;
