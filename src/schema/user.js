import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users(limit: Int): [User!]
    user(id: ID!): User
    me: User
    myCounts: Counts!
    myPosts(type: String): [Post!] @cacheControl(maxAge: 0)
    savedPosts: [SavedPost]
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
    savePost(id: ID!, reminder: Boolean): Boolean
    deleteSavedPost(id: ID!): Boolean!
    requestReset(email: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    revertEmail: Boolean!
  }

  type Token @cacheControl(maxAge: 0) {
    token: String!
  }

  type Counts {
    alerts: Int
    posts: Int
    saved: Int
  }

  type SavedPost {
    createdAt: Date
    post: Post!
    reminder: ID
  }

  type Subscription {
    endpoint: String!
    expirationTime: String
    p256dh: String!
    auth: String!
  }

  input KeysInput {
    p256dh: String!
    auth: String!
  }

  input SubscriptionInput {
    endpoint: String!
    expirationTime: String
    keys: KeysInput!
  }

  type User @cacheControl(maxAge: 0) {
    id: ID!
    username: String!
    email: String!
    secondaryEmail: String
    role: String!
    verified: Boolean!
    saved: [SavedPost]
  }
`;
