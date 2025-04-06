const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'schoolinc',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

// Initialize models
const db = {
  sequelize,
  Sequelize,
  User: require('./user')(sequelize, Sequelize),
  Class: require('./class')(sequelize, Sequelize),
  Course: require('./course')(sequelize, Sequelize),
  Grade: require('./grade')(sequelize, Sequelize),
};

// Define associations
db.User.belongsToMany(db.Class, { through: 'UserClasses' });
db.Class.belongsToMany(db.User, { through: 'UserClasses' });

db.Class.hasMany(db.Course);
db.Course.belongsTo(db.Class);

db.Course.hasMany(db.Grade);
db.Grade.belongsTo(db.Course);

db.User.hasMany(db.Grade);
db.Grade.belongsTo(db.User);

module.exports = db;
