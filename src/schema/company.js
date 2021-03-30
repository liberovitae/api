import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    company(id: ID!): Company!
  }

  extend type Mutation {
    createCompany(
      title: String!
      image: String
      website: String
      tagline: String
      twitter: String
      linkedin: String
    ): Company!
    deleteCompany(id: ID!): Boolean!
    updateCompany(
      id: ID!
      title: String!
      image: String
      website: String
      tagline: String
      twitter: String
      linkedin: String
    ): Company!
  }

  type CompanyInput {
    id: ID
    title: String!
    image: String
    website: String
    tagline: String
    twitter: String
    linkedin: String
  }

  type Company @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    image: String
    website: String
    tagline: String
    twitter: String
    linkedin: String
    createdAt: Date!
    user: User
    jobs: [Job]
  }
`;
