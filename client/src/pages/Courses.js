import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
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
} from '@mui/material';

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

const Courses = () => {
  const [open, setOpen] = useState(false);
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCourse({
        variables: {
          ...formData,
          credits: parseInt(formData.credits),
        },
      });
      handleClose();
      setFormData({ name: '', description: '', credits: 1, classId: '' });
    } catch (err) {
      console.error('Error creating course:', err);
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
        <Grid item>
          <Button variant="contained" onClick={handleOpen}>
            Add New Course
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {data.courses.map((course) => (
          <Grid item xs={12} md={6} key={course.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{course.name}</Typography>
              <Typography color="textSecondary" gutterBottom>
                Credits: {course.credits} | Class: {course.class?.name}
              </Typography>
              <Typography variant="body2">
                {course.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Course</DialogTitle>
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
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Courses;
