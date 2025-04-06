const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./models');
const { authenticate } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('App service is running');
});

// Apollo Server setup
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // Get the user token from the headers
      const token = req.headers.authorization || '';
      
      // Try to authenticate the user with the token
      const user = token ? await authenticate(token) : null;
      
      return { user };
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  // Sync database
  await db.sequelize.sync();
  console.log('Database synchronized');

  app.listen(PORT, () => {
    console.log(`App service running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer().catch(err => {
  console.error('Failed to start server:', err);
});
