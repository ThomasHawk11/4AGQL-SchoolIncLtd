import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Apollo Client setup for auth service
const authHttpLink = createHttpLink({
  uri: 'http://localhost:4001/graphql',
});

export const authClient = new ApolloClient({
  link: authHttpLink,
  cache: new InMemoryCache(),
});

// Apollo Client setup for main application
const appHttpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const appClient = new ApolloClient({
  link: authLink.concat(appHttpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
