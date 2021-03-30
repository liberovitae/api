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
    types: [String]
    dates: EventDatesInput
  }

  input EventInput {
    title: String!
    parent: ID!
    dates: EventDatesInput!
    location: EventLocationInput!
    image: String
    description: String!
    url: String!
    types: [String!]
    tags: [String!]
    status: String!
  }

  input EventDatesInput {
    start: Date
    end: Date
  }

  type EventDates {
    start: Date
    end: Date
  }

  type EventConnection @cacheControl(maxAge: 60) {
    edges: [Event!]!
    pageInfo: PageInfo!
  }

  type Event @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    dates: EventDates!
    parent: Venue!
    image: String
    location: EventLocation!
    description: String!
    url: String!
    types: [String!]
    tags: [String!]
    createdAt: Date!
    publishedAt: Date
    slug: String!
    status: String!
    featured: Boolean
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
