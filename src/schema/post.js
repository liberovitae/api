import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    posts(
      type: String
      cursor: Int
      limit: Int
      filter: PostFilterInput
      cache: Boolean
    ): PostConnection! @cacheControl(maxAge: 60)
    post(slug: String!, cache: Boolean): Post!
      @cacheControl(maxAge: 60)
  }

  extend type Mutation {
    createPost(input: PostInput!): Post!
    updatePost(id: ID!, input: PostInput!): Post!
    deletePost(id: ID!): Boolean!
    setPostStatus(id: ID!, status: String!): Boolean!
  }

  input PostFilterInput {
    keywords: String
    location: PostLocationInput
    types: [String]
    dates: PostDatesInput
  }

  input PostInput {
    type: String!
    title: String!
    parent: ID
    dates: PostDatesInput
    location: PostLocationInput!
    commentsEnabled: Boolean!
    image: String
    text: String!
    url: String!
    types: [String!]
    tags: [String!]
    status: String!
  }

  input PostDatesInput {
    start: Date
    end: Date
  }

  type PostDates {
    start: Date
    end: Date
  }

  type PostConnection @cacheControl(maxAge: 60) {
    edges: [Post!]!
    pageInfo: PageInfo!
  }

  type Post @cacheControl(maxAge: 60) {
    type: String!
    id: ID!
    title: String!
    dates: PostDates!
    parent: Post
    children: [Post]
    image: String
    location: PostLocation!
    commentsEnabled: Boolean
    comments: [Comment]
    commentCount: Int
    text: String!
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

  input PostLocationInput {
    name: String!
    lat: Float
    lon: Float
  }

  type PostLocation @cacheControl(maxAge: 60) {
    name: String!
    countryName: String
    lat: Float
    lon: Float
  }

  type PageInfo @cacheControl(maxAge: 60) {
    hasNextPage: Boolean!
    nextPage: Int
    totalDocs: Int
  }
`;
