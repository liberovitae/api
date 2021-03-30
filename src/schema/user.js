import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users(limit: Int): [User!]
    user(id: ID!): User
    me: User
    meCounts: Counts!
    meJobs: [Job!] @cacheControl(maxAge: 0)
    meVenues: [Venue!] @cacheControl(maxAge: 0)
    meEvents: [Event!] @cacheControl(maxAge: 0)
    savedItems: SavedItems!
    nearestCity(lat: Float!, lon: Float!): City!
  }

  extend type Mutation {
    signUp(
      username: String!
      email: String!
      password: String!
    ): Token!
    signIn(login: String!, password: String!): Token!
    verifyUser(token: String, type: String): Token!
    updateUser(email: String!): User!
    updatePassword(
      oldPassword: String!
      newPassword: String!
    ): Boolean!
    deleteUser(id: ID!): Boolean!
    saveItem(id: ID!, itemType: String!, reminder: Boolean): Boolean
    deleteSavedItem(id: ID!, itemType: String!): Boolean!
    requestReset(email: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    revertEmail: Boolean!
  }

  type Token @cacheControl(maxAge: 0) {
    token: String!
  }

  type Counts {
    alerts: AlertCounts
    jobs: Int
    saved: SavedCounts
    venues: Int
  }

  type SavedCounts {
    jobs: Int
    venues: Int
    events: Int
  }

  type AlertCounts {
    jobs: Int
    venues: Int
    events: Int
  }

  type SavedItems {
    jobs: [SavedJob]
    venues: [SavedVenue]
    events: [SavedEvent]
  }

  type SavedJob {
    createdAt: Date
    job: Job!
    reminder: ID
  }

  type SavedVenue {
    createdAt: Date
    venue: Venue!
    reminder: ID
  }

  type SavedEvent {
    createdAt: Date
    event: Event!
    reminder: ID
  }

  type User @cacheControl(maxAge: 0) {
    id: ID!
    username: String!
    email: String!
    secondaryEmail: String
    role: String!
    jobs: [Job]
    verified: Boolean!
    company: Company
    venues: [Venue]
  }
`;
