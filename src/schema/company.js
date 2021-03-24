import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    company(id: ID!): Company!
  }

  extend type Mutation {
    createCompany(
      name: String!
      logo: String
      website: String
      tagline: String
      twitter: String
      linkedin: String
    ): Company!
    deleteCompany(id: ID!): Boolean!
    updateCompany(
      id: ID!
      name: String!
      logo: String
      website: String
      tagline: String
      twitter: String
      linkedin: String
    ): Company!
  }

  type CompanyInput {
    id: ID
    name: String!
    logo: String
    website: String
    tagline: String
    twitter: String
    linkedin: String
  }

  type Company @cacheControl(maxAge: 60) {
    id: ID!
    name: String!
    logo: String
    website: String
    tagline: String
    twitter: String
    linkedin: String
    createdAt: Date!
    user: User
    jobs: [Job]
  }
`;
