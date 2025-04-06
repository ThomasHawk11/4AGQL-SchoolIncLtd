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
    classes: [Class!]
    grades: [Grade!]
    createdAt: String
    updatedAt: String
  }

  type Class {
    id: ID!
    name: String!
    description: String
    year: Int!
    students: [User!]
    courses: [Course!]
    createdAt: String
    updatedAt: String
  }

  type Course {
    id: ID!
    name: String!
    description: String
    credits: Int!
    class: Class
    grades: [Grade!]
    createdAt: String
    updatedAt: String
  }

  type Grade {
    id: ID!
    value: Float!
    comment: String
    date: String!
    course: Course!
    student: User!
    createdAt: String
    updatedAt: String
  }

  type GradeStats {
    average: Float
    median: Float
    lowest: Float
    highest: Float
    count: Int
  }

  type ClassGradeStats {
    classId: ID!
    className: String!
    stats: GradeStats!
  }

  type CourseGradeStats {
    courseId: ID!
    courseName: String!
    stats: GradeStats!
  }

  type StudentGradeStats {
    studentId: ID!
    studentName: String!
    stats: GradeStats!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User
    
    # Class queries
    classes(sortBy: String): [Class!]!
    class(id: ID!): Class
    
    # Course queries
    courses: [Course!]!
    course(id: ID!): Course
    
    # Grade queries
    myGrades(courseIds: [ID]): [Grade!]!
    studentGrades(studentId: ID!, courseIds: [ID]): [Grade!]!
    
    # Statistics queries
    classGradeStats(classId: ID!): ClassGradeStats!
    courseGradeStats(courseId: ID!): CourseGradeStats!
    studentGradeStats(studentId: ID!): StudentGradeStats!
  }

  type Mutation {
    # User mutations
    updateUser(id: ID!, email: String, pseudo: String, password: String): User!
    deleteUser(id: ID!): Boolean!
    
    # Class mutations
    createClass(name: String!, description: String, year: Int!): Class!
    updateClass(id: ID!, name: String, description: String, year: Int): Class!
    deleteClass(id: ID!): Boolean!
    addStudentToClass(classId: ID!, studentId: ID!): Class!
    
    # Course mutations
    createCourse(name: String!, description: String, credits: Int!, classId: ID!): Course!
    updateCourse(id: ID!, name: String, description: String, credits: Int, classId: ID): Course!
    deleteCourse(id: ID!): Boolean!
    
    # Grade mutations
    createGrade(value: Float!, comment: String, courseId: ID!, studentId: ID!): Grade!
    updateGrade(id: ID!, value: Float, comment: String): Grade!
    deleteGrade(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
