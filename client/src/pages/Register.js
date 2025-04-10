import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $pseudo: String!, $role: Role!) {
    register(email: $email, password: $password, pseudo: $pseudo, role: $role) {
      token
      user {
        id
        email
        pseudo
        role
      }
    }
  }
`;

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    pseudo: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: () => {
      navigate('/login');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerMutation({
        variables: formData,
      });
    } catch (err) {}
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Register
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Pseudo"
            value={formData.pseudo}
            onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            disabled={loading}
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="professor">Professor</MenuItem>
          </TextField>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Already have an account? Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
