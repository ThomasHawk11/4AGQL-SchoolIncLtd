import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Components
import { AuthProvider, useAuth } from './components/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Courses from './pages/Courses';
import Grades from './pages/Grades';
import Login from './pages/Login';
import Register from './pages/Register';

// Apollo Client setup for auth service
const authHttpLink = createHttpLink({
  uri: 'http://localhost:4001/graphql',
});

const authClient = new ApolloClient({
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

const appClient = new ApolloClient({
  link: authLink.concat(appHttpLink),
  cache: new InMemoryCache(),
});

// Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Auth Routes component with auth client
const AuthRoutes = () => (
  <ApolloProvider client={authClient}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  </ApolloProvider>
);

// App Routes component with app client
const AppRoutes = () => (
  <ApolloProvider client={appClient}>
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades"
        element={
          <ProtectedRoute>
            <Grades />
          </ProtectedRoute>
        }
      />
    </Routes>
  </ApolloProvider>
);

const AppContent = () => {
  const { token } = useAuth();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        {token ? <AppRoutes /> : <AuthRoutes />}
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
