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
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

const GET_CLASSES_AND_STUDENTS = gql`
  query GetClassesAndStudents {
    classes {
      id
      name
      description
      year
      students {
        id
        pseudo
        role
      }
    }
    users {
      id
      pseudo
      role
    }
  }
`;

const CREATE_CLASS = gql`
  mutation CreateClass($name: String!, $description: String, $year: Int!) {
    createClass(name: $name, description: $description, year: $year) {
      id
      name
      description
      year
    }
  }
`;

const ADD_STUDENT_TO_CLASS = gql`
  mutation AddStudentToClass($classId: ID!, $studentId: ID!) {
    addStudentToClass(classId: $classId, studentId: $studentId) {
      id
      name
      students {
        id
        pseudo
      }
    }
  }
`;

const Classes = () => {
  const [open, setOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: new Date().getFullYear(),
  });

  const { loading, error, data } = useQuery(GET_CLASSES_AND_STUDENTS);
  const [createClass] = useMutation(CREATE_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });
  const [addStudentToClass] = useMutation(ADD_STUDENT_TO_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createClass({
        variables: {
          ...formData,
          year: parseInt(formData.year),
        },
      });
      handleClose();
      setFormData({ name: '', description: '', year: new Date().getFullYear() });
    } catch (err) {
      console.error('Error creating class:', err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  const handleAddStudentOpen = (class_) => {
    setSelectedClass(class_);
    setAddStudentDialogOpen(true);
  };

  const handleAddStudentClose = () => {
    setSelectedClass(null);
    setSelectedStudent('');
    setAddStudentDialogOpen(false);
  };

  const handleAddStudent = async () => {
    try {
      await addStudentToClass({
        variables: {
          classId: selectedClass.id,
          studentId: selectedStudent,
        },
      });
      handleAddStudentClose();
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Classes</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={handleOpen} startIcon={<AddIcon />}>
            Add New Class
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {data?.classes.map((class_) => (
          <Grid item xs={12} md={6} key={class_.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{class_.name}</Typography>
              <Typography color="textSecondary" gutterBottom>
                Year: {class_.year}
              </Typography>
              <Typography variant="body2" paragraph>
                {class_.description}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Students
                <IconButton 
                  size="small" 
                  sx={{ ml: 1 }}
                  onClick={() => handleAddStudentOpen(class_)}
                >
                  <PersonAddIcon />
                </IconButton>
              </Typography>
              
              <List dense>
                {class_.students?.map((student) => (
                  <ListItem key={student.id}>
                    <ListItemText primary={student.pseudo} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Class Name"
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
            label="Year"
            type="number"
            fullWidth
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addStudentDialogOpen} onClose={handleAddStudentClose}>
        <DialogTitle>Add Student to {selectedClass?.name}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Select Student"
            select
            fullWidth
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            {data?.users
              .filter(user => user.role === 'student' && 
                !selectedClass?.students.some(s => s.id === user.id))
              .map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.pseudo}
                </MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddStudentClose}>Cancel</Button>
          <Button 
            onClick={handleAddStudent} 
            variant="contained"
            disabled={!selectedStudent}
          >
            Add Student
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Classes;
