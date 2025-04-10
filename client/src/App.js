import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { authClient, appClient } from './apolloClient';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './components/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Courses from './pages/Courses';
import Grades from './pages/Grades';
import Login from './pages/Login';
import Register from './pages/Register';

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

// App Content component with all routes
const AuthContent = () => (
  <Routes>
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
  </Routes>
);

const MainContent = () => (
  <Routes>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route
      path="dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="classes"
      element={
        <ProtectedRoute>
          <Classes />
        </ProtectedRoute>
      }
    />
    <Route
      path="courses"
      element={
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      }
    />
    <Route
      path="grades"
      element={
        <ProtectedRoute>
          <Grades />
        </ProtectedRoute>
      }
    />
  </Routes>
);

const AppContent = () => {
  const { token } = useAuth();
  
  return (
    <>
      <Navbar />
      {token ? (
        <ApolloProvider client={appClient}>
          <MainContent />
        </ApolloProvider>
      ) : (
        <ApolloProvider client={authClient}>
          <AuthContent />
        </ApolloProvider>
      )}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
