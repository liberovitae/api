import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    jobs(
      cursor: Int
      limit: Int
      filter: JobFilterInput
      cache: Boolean
    ): JobConnection! @cacheControl(maxAge: 60)
    job(slug: String!, cache: Boolean): Job! @cacheControl(maxAge: 60)
    location(location: String!): [City!]!
  }

  extend type Mutation {
    createJob(input: JobInput!): Job!
    updateJob(id: ID!, input: JobInput!): Job!
    deleteJob(id: ID!): Boolean!
    setJobStatus(id: ID!, status: String!): Boolean!
  }

  input JobFilterInput {
    keywords: String
    location: JobLocationInput
    regions: [String]
    types: [String]
  }

  input JobInput {
    title: String!
    location: JobLocationInput!
    description: String!
    url: String!
    regions: [String!]
    types: [String!]
    tags: [String!]
    status: String!
  }

  type JobConnection @cacheControl(maxAge: 60) {
    edges: [Job!]!
    pageInfo: PageInfo!
  }

  type PageInfo @cacheControl(maxAge: 60) {
    hasNextPage: Boolean!
    nextPage: Int
    totalDocs: Int
  }

  type Job @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    company: Company!
    location: JobLocation!
    description: String!
    url: String!
    regions: [String!]
    types: [String!]
    tags: [String!]
    createdAt: Date!
    publishedAt: Date
    slug: String!
    status: String!
    featured: Boolean
    stats: Stats
  }

  input JobLocationInput {
    name: String!
    lat: Float
    lon: Float
  }

  type JobLocation @cacheControl(maxAge: 60) {
    name: String!
    countryName: String
    lat: Float
    lon: Float
  }

  # extend type Subscription {
  #   jobCreated: JobCreated!
  # }
`;
