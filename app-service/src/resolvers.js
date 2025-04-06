const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { authorize } = require('./utils/auth');
const { calculateGradeStats } = require('./utils/gradeUtils');
const db = require('./models');
const { Op } = require('sequelize');

const resolvers = {
  Query: {
    // User queries
    me: (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      return db.User.findByPk(user.id);
    },
    
    users: async (_, __, { user }) => {
      // Anyone can see the list of users
      return db.User.findAll();
    },
    
    user: async (_, { id }, { user }) => {
      // Anyone can see user details
      return db.User.findByPk(id);
    },
    
    // Class queries
    classes: async (_, { sortBy }, { user }) => {
      // Anyone can see classes
      const order = sortBy ? [[sortBy, 'ASC']] : [['name', 'ASC']];
      return db.Class.findAll({ order });
    },
    
    class: async (_, { id }, { user }) => {
      // Anyone can see class details
      return db.Class.findByPk(id);
    },
    
    // Course queries
    courses: async (_, __, { user }) => {
      // Anyone can see courses
      return db.Course.findAll();
    },
    
    course: async (_, { id }, { user }) => {
      // Anyone can see course details
      return db.Course.findByPk(id);
    },
    
    // Grade queries
    myGrades: async (_, { courseIds }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const where = { UserId: user.id };
      
      if (courseIds && courseIds.length > 0) {
        where.CourseId = { [Op.in]: courseIds };
      }
      
      return db.Grade.findAll({ where });
    },
    
    studentGrades: async (_, { studentId, courseIds }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Only professors can see other students' grades
      if (user.role !== 'professor' && user.id !== studentId) {
        throw new ForbiddenError('Only professors can view other students\' grades');
      }
      
      const where = { UserId: studentId };
      
      if (courseIds && courseIds.length > 0) {
        where.CourseId = { [Op.in]: courseIds };
      }
      
      return db.Grade.findAll({ where });
    },
    
    // Statistics queries
    classGradeStats: async (_, { classId }, { user }) => {
      // Only professors can see class grade statistics
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can view class grade statistics');
      }
      
      const classObj = await db.Class.findByPk(classId);
      if (!classObj) {
        throw new UserInputError('Class not found');
      }
      
      // Get all courses for this class
      const courses = await db.Course.findAll({ where: { ClassId: classId } });
      const courseIds = courses.map(course => course.id);
      
      // Get all grades for these courses
      const grades = await db.Grade.findAll({
        where: { CourseId: { [Op.in]: courseIds } },
      });
      
      return {
        classId,
        className: classObj.name,
        stats: calculateGradeStats(grades),
      };
    },
    
    courseGradeStats: async (_, { courseId }, { user }) => {
      // Only professors can see course grade statistics
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can view course grade statistics');
      }
      
      const course = await db.Course.findByPk(courseId);
      if (!course) {
        throw new UserInputError('Course not found');
      }
      
      // Get all grades for this course
      const grades = await db.Grade.findAll({ where: { CourseId: courseId } });
      
      return {
        courseId,
        courseName: course.name,
        stats: calculateGradeStats(grades),
      };
    },
    
    studentGradeStats: async (_, { studentId }, { user }) => {
      // Only professors or the student themselves can see student grade statistics
      if (!user || (user.role !== 'professor' && user.id !== studentId)) {
        throw new ForbiddenError('Only professors or the student themselves can view student grade statistics');
      }
      
      const student = await db.User.findByPk(studentId);
      if (!student) {
        throw new UserInputError('Student not found');
      }
      
      // Get all grades for this student
      const grades = await db.Grade.findAll({ where: { UserId: studentId } });
      
      return {
        studentId,
        studentName: student.pseudo,
        stats: calculateGradeStats(grades),
      };
    },
  },
  
  Mutation: {
    // User mutations
    updateUser: async (_, { id, email, pseudo, password }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Users can only update themselves
      if (user.id !== id) {
        throw new ForbiddenError('You can only update your own account');
      }
      
      const updateData = {};
      if (email) updateData.email = email;
      if (pseudo) updateData.pseudo = pseudo;
      if (password) updateData.password = password;
      
      const userToUpdate = await db.User.findByPk(id);
      if (!userToUpdate) {
        throw new UserInputError('User not found');
      }
      
      await userToUpdate.update(updateData);
      return userToUpdate;
    },
    
    deleteUser: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Users can only delete themselves
      if (user.id !== id) {
        throw new ForbiddenError('You can only delete your own account');
      }
      
      const userToDelete = await db.User.findByPk(id);
      if (!userToDelete) {
        throw new UserInputError('User not found');
      }
      
      await userToDelete.destroy();
      return true;
    },
    
    // Class mutations
    createClass: async (_, { name, description, year }, { user }) => {
      // Only professors can create classes
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can create classes');
      }
      
      return db.Class.create({ name, description, year });
    },
    
    updateClass: async (_, { id, name, description, year }, { user }) => {
      // Only professors can update classes
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can update classes');
      }
      
      const classToUpdate = await db.Class.findByPk(id);
      if (!classToUpdate) {
        throw new UserInputError('Class not found');
      }
      
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (year) updateData.year = year;
      
      await classToUpdate.update(updateData);
      return classToUpdate;
    },
    
    deleteClass: async (_, { id }, { user }) => {
      // Only professors can delete classes
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can delete classes');
      }
      
      const classToDelete = await db.Class.findByPk(id);
      if (!classToDelete) {
        throw new UserInputError('Class not found');
      }
      
      // Check if there are students in this class
      const studentCount = await classToDelete.countUsers();
      if (studentCount > 0) {
        throw new ForbiddenError('Cannot delete a class with students');
      }
      
      await classToDelete.destroy();
      return true;
    },
    
    addStudentToClass: async (_, { classId, studentId }, { user }) => {
      // Only professors can add students to classes
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can add students to classes');
      }
      
      const classObj = await db.Class.findByPk(classId);
      if (!classObj) {
        throw new UserInputError('Class not found');
      }
      
      const student = await db.User.findByPk(studentId);
      if (!student) {
        throw new UserInputError('Student not found');
      }
      
      if (student.role !== 'student') {
        throw new UserInputError('User is not a student');
      }
      
      await classObj.addUser(student);
      return classObj;
    },
    
    // Course mutations
    createCourse: async (_, { name, description, credits, classId }, { user }) => {
      // Only professors can create courses
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can create courses');
      }
      
      const classObj = await db.Class.findByPk(classId);
      if (!classObj) {
        throw new UserInputError('Class not found');
      }
      
      return db.Course.create({ name, description, credits, ClassId: classId });
    },
    
    updateCourse: async (_, { id, name, description, credits, classId }, { user }) => {
      // Only professors can update courses
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can update courses');
      }
      
      const courseToUpdate = await db.Course.findByPk(id);
      if (!courseToUpdate) {
        throw new UserInputError('Course not found');
      }
      
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (credits) updateData.credits = credits;
      if (classId) {
        const classObj = await db.Class.findByPk(classId);
        if (!classObj) {
          throw new UserInputError('Class not found');
        }
        updateData.ClassId = classId;
      }
      
      await courseToUpdate.update(updateData);
      return courseToUpdate;
    },
    
    deleteCourse: async (_, { id }, { user }) => {
      // Only professors can delete courses
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can delete courses');
      }
      
      const courseToDelete = await db.Course.findByPk(id);
      if (!courseToDelete) {
        throw new UserInputError('Course not found');
      }
      
      await courseToDelete.destroy();
      return true;
    },
    
    // Grade mutations
    createGrade: async (_, { value, comment, courseId, studentId }, { user }) => {
      // Only professors can create grades
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can create grades');
      }
      
      const course = await db.Course.findByPk(courseId);
      if (!course) {
        throw new UserInputError('Course not found');
      }
      
      const student = await db.User.findByPk(studentId);
      if (!student) {
        throw new UserInputError('Student not found');
      }
      
      if (student.role !== 'student') {
        throw new UserInputError('User is not a student');
      }
      
      return db.Grade.create({
        value,
        comment,
        CourseId: courseId,
        UserId: studentId,
      });
    },
    
    updateGrade: async (_, { id, value, comment }, { user }) => {
      // Only professors can update grades
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can update grades');
      }
      
      const gradeToUpdate = await db.Grade.findByPk(id);
      if (!gradeToUpdate) {
        throw new UserInputError('Grade not found');
      }
      
      const updateData = {};
      if (value !== undefined) updateData.value = value;
      if (comment !== undefined) updateData.comment = comment;
      
      await gradeToUpdate.update(updateData);
      return gradeToUpdate;
    },
    
    deleteGrade: async (_, { id }, { user }) => {
      // Only professors can delete grades
      if (!user || user.role !== 'professor') {
        throw new ForbiddenError('Only professors can delete grades');
      }
      
      const gradeToDelete = await db.Grade.findByPk(id);
      if (!gradeToDelete) {
        throw new UserInputError('Grade not found');
      }
      
      await gradeToDelete.destroy();
      return true;
    },
  },
  
  // Field resolvers
  User: {
    classes: async (user) => {
      return user.getClasses();
    },
    grades: async (user) => {
      return user.getGrades();
    },
  },
  
  Class: {
    students: async (classObj) => {
      return classObj.getUsers({ where: { role: 'student' } });
    },
    courses: async (classObj) => {
      return classObj.getCourses();
    },
  },
  
  Course: {
    class: async (course) => {
      return course.getClass();
    },
    grades: async (course) => {
      return course.getGrades();
    },
  },
  
  Grade: {
    course: async (grade) => {
      return grade.getCourse();
    },
    student: async (grade) => {
      return grade.getUser();
    },
  },
};

module.exports = resolvers;
