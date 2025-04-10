import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';

// GraphQL queries and mutations
const GET_STUDENTS = gql`
  query GetStudents {
    users {
      id
      email
      pseudo
      role
      classes {
        id
        name
        year
      }
    }
  }
`;



const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $email: String, $pseudo: String) {
    updateUser(id: $id, email: $email, pseudo: $pseudo) {
      id
      email
      pseudo
      role
    }
  }
`;

const Students = () => {
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';
  
  // States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    pseudo: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // GraphQL hooks
  const { loading, error, data } = useQuery(GET_STUDENTS);
  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // Handlers
  const handleEditOpen = (student) => {
    setSelectedStudent(student);
    setFormData({
      email: student.email,
      pseudo: student.pseudo,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setSelectedStudent(null);
    setEditDialogOpen(false);
  };



  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        variables: {
          id: selectedStudent.id,
          email: formData.email.trim(),
          pseudo: formData.pseudo.trim(),
        },
      });
      handleEditClose();
    } catch (err) {
      console.error('Error updating student:', err);
    }
  };



  // Loading and error states
  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;
  
  // Filter students
  const students = data?.users.filter(user => user.role === 'student') || [];
  const filteredStudents = students.filter(student => 
    student.pseudo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );



  // Redirect if not a professor
  if (!isProfessor) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page. Only professors can manage students.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Student Management</Typography>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Search students by name or email"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
      </Paper>

      <Grid container spacing={3}>
        {filteredStudents.map((student) => (
          <Grid item xs={12} md={6} key={student.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{student.pseudo}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {student.email}
                  </Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEditOpen(student)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
  
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Enrolled Classes
              </Typography>
              
              {student.classes.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  Not enrolled in any class
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {student.classes.map((classObj) => (
                    <Chip
                      key={classObj.id}
                      label={`${classObj.name} (${classObj.year})`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={formData.pseudo}
            onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default Students;
