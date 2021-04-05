import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    comments(
      postId: ID!
      cursor: Int
      limit: Int
      filter: CommentFilterInput
      cache: Boolean
    ): CommentConnection! @cacheControl(maxAge: 60)
    comment(slug: String!, cache: Boolean): Comment!
      @cacheControl(maxAge: 60)
  }

  extend type Mutation {
    createComment(
      input: CommentInput!
      postId: ID!
      parentId: ID
    ): Comment!
    updateComment(id: ID!, input: CommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  input CommentFilterInput {
    keywords: String
  }

  input CommentInput {
    text: String!
  }

  type CommentConnection @cacheControl(maxAge: 60) {
    edges: [Comment!]!
    pageInfo: PageInfo!
  }

  type Comment @cacheControl(maxAge: 60) {
    id: ID!
    text: String!
    author: User!
    postId: ID!
    parentId: ID
    depth: Int!
    createdAt: Date!
    children: [Comment]
    slug: String!
  }
`;
