import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    events(
      cursor: Int
      limit: Int
      filter: EventFilterInput
      cache: Boolean
    ): EventConnection! @cacheControl(maxAge: 60)
    event(slug: String!, cache: Boolean): Event!
      @cacheControl(maxAge: 60)
  }

  extend type Mutation {
    createEvent(input: EventInput!): Event!
    updateEvent(id: ID!, input: EventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    setEventStatus(id: ID!, status: String!): Boolean!
  }

  input EventFilterInput {
    keywords: String
    location: EventLocationInput
    regions: [String]
    types: [String]
  }

  input EventInput {
    title: String!
    location: EventLocationInput!
    logo: String
    description: String!
    url: String!
    regions: [String!]
    types: [String!]
    tags: [String!]
    status: String!
  }

  type EventConnection @cacheControl(maxAge: 60) {
    edges: [Event!]!
    pageInfo: PageInfo!
  }

  type Event @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    logo: String
    location: EventLocation!
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
    userId: ID
    venueId: ID
    stats: Stats
  }

  input EventLocationInput {
    name: String!
    lat: Float
    lon: Float
  }

  type EventLocation @cacheControl(maxAge: 60) {
    name: String!
    countryName: String
    lat: Float
    lon: Float
  }
`;
