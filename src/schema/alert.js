import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    alerts: [Alert]!
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
    title: String!
    alertType: String!
    slug: String!
    keywords: String
    location: String
    types: [String]
    frequency: String!
    active: Boolean!
    email: Boolean!
    notification: Boolean!
    subscription: Subscription
    createdAt: Date!
  }

  input AlertInput {
    id: ID
    title: String!
    alertType: String!
    keywords: String
    location: String
    types: [String]
    frequency: String!
    active: Boolean!
    email: Boolean!
    notification: Boolean!
    subscription: SubscriptionInput
  }
`;
