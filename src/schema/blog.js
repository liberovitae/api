import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    blog(slug: String!): Blog!
    blogs: [Blog!]
    allBlogs: [Blog!] @cacheControl(maxAge: 0)
  }

  extend type Mutation {
    createBlog(input: BlogInput!): Blog!
    deleteBlog(id: ID!): Boolean!
    updateBlog(id: ID!, input: BlogInput!): Blog!
    setBlogStatus(id: ID!, status: String!): Boolean!
  }

  input BlogInput {
    id: ID
    title: String!
    subtitle: String
    text: String!
    status: String!
  }

  type Blog @cacheControl(maxAge: 60) {
    id: ID!
    title: String!
    subtitle: String
    text: String!
    status: String!
    slug: String!
  }
`;
