const bcrypt = require('bcryptjs');
const db = require('../models');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await db.Grade.destroy({ where: {} });
    await db.Course.destroy({ where: {} });
    await db.Class.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    console.log('Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const professor1 = await db.User.create({
      email: 'professor1@schoolinc.com',
      pseudo: 'Professor Smith',
      password: hashedPassword,
      role: 'professor',
    });

    const professor2 = await db.User.create({
      email: 'professor2@schoolinc.com',
      pseudo: 'Professor Johnson',
      password: hashedPassword,
      role: 'professor',
    });

    const student1 = await db.User.create({
      email: 'student1@schoolinc.com',
      pseudo: 'John Doe',
      password: hashedPassword,
      role: 'student',
    });

    const student2 = await db.User.create({
      email: 'student2@schoolinc.com',
      pseudo: 'Jane Smith',
      password: hashedPassword,
      role: 'student',
    });

    const student3 = await db.User.create({
      email: 'student3@schoolinc.com',
      pseudo: 'Bob Brown',
      password: hashedPassword,
      role: 'student',
    });

    console.log('Created users');

    // Create classes
    const class1 = await db.Class.create({
      name: 'Computer Science 101',
      description: 'Introduction to Computer Science',
      year: 2025,
    });

    const class2 = await db.Class.create({
      name: 'Mathematics 201',
      description: 'Advanced Mathematics',
      year: 2025,
    });

    console.log('Created classes');

    // Add students to classes
    await class1.addUser(student1);
    await class1.addUser(student2);
    await class2.addUser(student2);
    await class2.addUser(student3);

    console.log('Added students to classes');

    // Create courses
    const course1 = await db.Course.create({
      name: 'Programming Fundamentals',
      description: 'Learn the basics of programming',
      credits: 3,
      ClassId: class1.id,
    });

    const course2 = await db.Course.create({
      name: 'Data Structures',
      description: 'Learn about data structures',
      credits: 4,
      ClassId: class1.id,
    });

    const course3 = await db.Course.create({
      name: 'Calculus',
      description: 'Advanced calculus techniques',
      credits: 3,
      ClassId: class2.id,
    });

    console.log('Created courses');

    // Create grades
    await db.Grade.create({
      value: 15,
      comment: 'Excellent work',
      UserId: student1.id,
      CourseId: course1.id,
    });

    await db.Grade.create({
      value: 12,
      comment: 'Good effort',
      UserId: student1.id,
      CourseId: course2.id,
    });

    await db.Grade.create({
      value: 18,
      comment: 'Outstanding',
      UserId: student2.id,
      CourseId: course1.id,
    });

    await db.Grade.create({
      value: 14,
      comment: 'Very good',
      UserId: student2.id,
      CourseId: course3.id,
    });

    await db.Grade.create({
      value: 10,
      comment: 'Needs improvement',
      UserId: student3.id,
      CourseId: course3.id,
    });

    console.log('Created grades');

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
}

// Run the seed function
seed();
