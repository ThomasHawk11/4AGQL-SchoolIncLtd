import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const authHttpLink = createHttpLink({
  uri: 'http://localhost:4001/graphql',
});

export const authClient = new ApolloClient({
  link: authHttpLink,
  cache: new InMemoryCache(),
});

const appHttpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
  fetchOptions: {
    mode: 'cors',
  },
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
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
