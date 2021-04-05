import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    location(location: String!): [City!]!
  }

  type City {
    name: String!
    country: String!
    adminCode: String
    lat: Float!
    lon: Float!
    population: Int!
  }
`;
