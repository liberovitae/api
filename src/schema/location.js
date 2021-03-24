import { gql } from 'apollo-server-express';

export default gql`
  type City {
    name: String!
    country: String!
    adminCode: String
    lat: Float!
    lon: Float!
    population: Int!
  }
`;
