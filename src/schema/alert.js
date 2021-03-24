import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    alerts: Alerts!
    alert(slug: String!): Alert!
  }

  extend type Mutation {
    createAlert(input: AlertInput!): Alert!
    deleteAlert(id: ID!): Boolean!
    updateAlert(id: ID!, input: AlertInput!): Alert!
    toggleActivate(id: ID!): Boolean
  }

  type Alert {
    id: ID!
    name: String!
    alertType: String!
    slug: String!
    keywords: String
    location: String
    regions: [String]
    types: [String]
    frequency: String!
    active: Boolean!
    email: Boolean!
    notification: Boolean!
    subscription: Subscription
    createdAt: Date!
  }

  type Alerts {
    jobs: [Alert]
    venues: [Alert]
  }

  input AlertInput {
    id: ID
    name: String!
    alertType: String!
    keywords: String
    location: String
    regions: [String]
    types: [String]
    frequency: String!
    active: Boolean!
    email: Boolean!
    notification: Boolean!
    subscription: SubscriptionInput
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
`;
