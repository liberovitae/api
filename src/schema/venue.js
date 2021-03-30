import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    venues(
      cursor: Int
      limit: Int
      filter: VenueFilterInput
      cache: Boolean
    ): VenueConnection! @cacheControl(maxAge: 60)
    venue(slug: String!, cache: Boolean): Venue!
      @cacheControl(maxAge: 60)
  }

  extend type Mutation {
    createVenue(input: VenueInput!): Venue!
    updateVenue(id: ID!, input: VenueInput!): Venue!
    deleteVenue(id: ID!): Boolean!
    setVenueStatus(id: ID!, status: String!): Boolean!
  }

  input VenueFilterInput {
    keywords: String
    location: VenueLocationInput
    types: [String]
  }

  input VenueInput {
    title: String!
    location: VenueLocationInput!
    image: String
    description: String!
    url: String!
    types: [String!]
    tags: [String!]
    status: String!
  }

  type VenueConnection @cacheControl(maxAge: 60) {
    edges: [Venue!]!
    pageInfo: PageInfo!
  }

  type Venue @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    image: String
    location: VenueLocation!
    description: String!
    url: String!
    types: [String!]
    tags: [String!]
    children: [Event]
    createdAt: Date!
    publishedAt: Date
    slug: String!
    status: String!
    featured: Boolean
    userId: ID
    stats: Stats
  }

  input VenueLocationInput {
    name: String!
    lat: Float
    lon: Float
  }

  type VenueLocation @cacheControl(maxAge: 60) {
    name: String!
    countryName: String
    lat: Float
    lon: Float
  }
`;
