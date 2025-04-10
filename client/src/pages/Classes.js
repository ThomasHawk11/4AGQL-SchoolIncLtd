import React, { useState, useEffect, useMemo } from 'react';
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
  Box,
} from '@mui/material';
import { Add as AddIcon, PersonAdd as PersonAddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';

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

const UPDATE_CLASS = gql`
  mutation UpdateClass($id: ID!, $name: String, $description: String, $year: Int) {
    updateClass(id: $id, name: $name, description: $description, year: $year) {
      id
      name
      description
      year
      students {
        id
        pseudo
      }
    }
  }
`;

const DELETE_CLASS = gql`
  mutation DeleteClass($id: ID!) {
    deleteClass(id: $id)
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

const REMOVE_STUDENT_FROM_CLASS = gql`
  mutation RemoveStudentFromClass($classId: ID!, $studentId: ID!) {
    removeStudentFromClass(classId: $classId, studentId: $studentId) {
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
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [removeStudentDialogOpen, setRemoveStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: new Date().getFullYear(),
  });

  const { loading, error, data } = useQuery(GET_CLASSES_AND_STUDENTS);
  const [createClass] = useMutation(CREATE_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });
  const [updateClass] = useMutation(UPDATE_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });
  const [deleteClass] = useMutation(DELETE_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });
  const [addStudentToClass] = useMutation(ADD_STUDENT_TO_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });
  const [removeStudentFromClass] = useMutation(REMOVE_STUDENT_FROM_CLASS, {
    refetchQueries: [{ query: GET_CLASSES_AND_STUDENTS }],
  });

  const handleCreateOpen = () => {
    setFormData({ name: '', description: '', year: new Date().getFullYear() });
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => setCreateDialogOpen(false);

  const handleEditOpen = (class_) => {
    setSelectedClass(class_);
    setFormData({
      name: class_.name,
      description: class_.description || '',
      year: class_.year,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setSelectedClass(null);
    setEditDialogOpen(false);
  };

  useEffect(() => {
    if (data?.users && selectedClass) {
      const students = data.users.filter(
        user => user.role === 'student' && 
        !selectedClass.students.some(s => s.id === user.id)
      );
      setAvailableStudents(students);
    } else {
      setAvailableStudents([]);
    }
  }, [data?.users, selectedClass]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createClass({
        variables: {
          ...formData,
          year: parseInt(formData.year),
        },
      });
      handleCreateClose();
      setFormData({ name: '', description: '', year: new Date().getFullYear() });
    } catch (err) {
      console.error('Error creating class:', err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const variables = {
        id: selectedClass.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        year: parseInt(formData.year)
      };

      await updateClass({
        variables: variables
      });
      handleEditClose();
    } catch (err) {
      console.error('Error updating class:', err);
      alert('Error updating class: ' + err.message);
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      await deleteClass({
        variables: { id: classId },
      });
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  const handleAddStudentOpen = (class_) => {
    setSelectedClass(class_);
    setSelectedStudent('');
    setAddStudentDialogOpen(true);
  };

  const handleAddStudentClose = () => {
    setSelectedClass(null);
    setSelectedStudent('');
    setAddStudentDialogOpen(false);
  };

  const handleRemoveStudentOpen = (classObj, student) => {
    setSelectedClass(classObj);
    setStudentToRemove(student);
    setRemoveStudentDialogOpen(true);
  };

  const handleRemoveStudentClose = () => {
    setSelectedClass(null);
    setStudentToRemove(null);
    setRemoveStudentDialogOpen(false);
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

  const handleRemoveStudent = async () => {
    try {
      await removeStudentFromClass({
        variables: {
          classId: selectedClass.id,
          studentId: studentToRemove.id,
        },
      });
      handleRemoveStudentClose();
    } catch (err) {
      console.error('Error removing student:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Classes</Typography>
        </Grid>
        {isProfessor && (
          <Grid item>
            <Button variant="contained" onClick={handleCreateOpen} startIcon={<AddIcon />}>
              Add New Class
            </Button>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {data?.classes.map((class_) => (
          <Grid item xs={12} md={6} key={class_.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{class_.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Year: {class_.year}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {class_.description}
                  </Typography>
                </Box>
                {isProfessor && (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditOpen(class_)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(class_.id)}
                      disabled={class_.students?.length > 0}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Students
                {isProfessor && (
                  <IconButton 
                    size="small" 
                    sx={{ ml: 1 }}
                    onClick={() => handleAddStudentOpen(class_)}
                  >
                    <PersonAddIcon />
                  </IconButton>
                )}
              </Typography>
              
              <List dense>
                {class_.students?.map((student) => (
                  <ListItem key={student.id}>
                    <ListItemText primary={student.pseudo} />
                    {isProfessor && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="remove"
                          size="small"
                          onClick={() => handleRemoveStudentOpen(class_, student)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={createDialogOpen} onClose={handleCreateClose}>
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
          <Button onClick={handleCreateClose}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
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
            {availableStudents.map((student) => (
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

      <Dialog open={removeStudentDialogOpen} onClose={handleRemoveStudentClose}>
        <DialogTitle>Remove Student from Class</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{studentToRemove?.pseudo}</strong> from <strong>{selectedClass?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveStudentClose}>Cancel</Button>
          <Button 
            onClick={handleRemoveStudent} 
            variant="contained"
            color="error"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Class</DialogTitle>
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
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Classes;
