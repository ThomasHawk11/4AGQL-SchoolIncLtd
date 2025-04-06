const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum Role {
    student
    professor
  }

  type User {
    id: ID!
    email: String!
    pseudo: String!
    role: Role!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # Verify if a token is valid
    verifyToken(token: String!): User
  }

  type Mutation {
    # Register a new user
    register(email: String!, pseudo: String!, password: String!, role: Role!): AuthPayload!
    
    # Login with email and password
    login(email: String!, password: String!): AuthPayload!
  }
`;

module.exports = typeDefs;
