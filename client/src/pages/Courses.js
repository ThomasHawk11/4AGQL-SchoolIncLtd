import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../components/AuthContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Box,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const GET_COURSES_AND_CLASSES = gql`
  query GetCoursesAndClasses {
    courses {
      id
      name
      description
      credits
      class {
        id
        name
      }
    }
    classes {
      id
      name
    }
  }
`;

const CREATE_COURSE = gql`
  mutation CreateCourse($name: String!, $description: String, $credits: Int!, $classId: ID!) {
    createCourse(name: $name, description: $description, credits: $credits, classId: $classId) {
      id
      name
      description
      credits
      class {
        id
        name
      }
    }
  }
`;

const UPDATE_COURSE = gql`
  mutation UpdateCourse($id: ID!, $name: String!, $description: String, $credits: Int!, $classId: ID!) {
    updateCourse(id: $id, name: $name, description: $description, credits: $credits, classId: $classId) {
      id
      name
      description
      credits
      class {
        id
        name
      }
    }
  }
`;

const DELETE_COURSE = gql`
  mutation DeleteCourse($id: ID!) {
    deleteCourse(id: $id)
  }
`;

const Courses = () => {
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';

  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credits: 1,
    classId: '',
  });

  const { loading, error, data } = useQuery(GET_COURSES_AND_CLASSES);
  const [createCourse] = useMutation(CREATE_COURSE, {
    refetchQueries: [{ query: GET_COURSES_AND_CLASSES }],
  });
  const [updateCourse] = useMutation(UPDATE_COURSE, {
    refetchQueries: [{ query: GET_COURSES_AND_CLASSES }],
  });
  const [deleteCourse] = useMutation(DELETE_COURSE, {
    refetchQueries: [{ query: GET_COURSES_AND_CLASSES }],
  });

  const handleOpen = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      description: '',
      credits: 1,
      classId: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourse(null);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      credits: course.credits,
      classId: course.class.id,
    });
    setOpen(true);
  };

  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCourse({
        variables: { id: selectedCourse.id },
      });
      setDeleteConfirmOpen(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateCourse({
          variables: {
            id: editingCourse.id,
            ...formData,
            credits: parseInt(formData.credits),
          },
        });
      } else {
        await createCourse({
          variables: {
            ...formData,
            credits: parseInt(formData.credits),
          },
        });
      }
      handleClose();
      setFormData({ name: '', description: '', credits: 1, classId: '' });
    } catch (err) {
      console.error('Error saving course:', err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Courses</Typography>
        </Grid>
        {isProfessor && (
          <Grid item>
            <Button variant="contained" onClick={handleOpen} startIcon={<AddIcon />}>
              Add New Course
            </Button>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {data.courses.map((course) => (
          <Grid item xs={12} md={6} key={course.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{course.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Credits: {course.credits} | Class: {course.class?.name}
                  </Typography>
                  <Typography variant="body2">
                    {course.description}
                  </Typography>
                </Box>
                {isProfessor && (
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(course)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(course)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Credits"
            type="number"
            fullWidth
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Class"
            select
            fullWidth
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          >
            {data.classes.map((class_) => (
              <MenuItem key={class_.id} value={class_.id}>
                {class_.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCourse ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the course "{selectedCourse?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Courses;
