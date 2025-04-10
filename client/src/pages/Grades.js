import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';

const GET_GRADES_DATA = gql`
  query GetGradesData {
    me {
      id
      role
    }
    courses {
      id
      name
      class {
        id
        name
        students {
          id
          pseudo
          grades {
            id
            value
            comment
            date
            course {
              id
              name
              class {
                id
                name
              }
            }
            student {
              id
              pseudo
            }
          }
        }
      }
    }
    myGrades {
      id
      value
      comment
      date
      course {
        id
        name
        class {
          id
          name
        }
      }
      student {
        id
        pseudo
      }
    }
  }
`;

const CREATE_GRADE = gql`
  mutation CreateGrade($value: Float!, $comment: String, $courseId: ID!, $studentId: ID!) {
    createGrade(value: $value, comment: $comment, courseId: $courseId, studentId: $studentId) {
      id
      value
      comment
      date
      course {
        id
        name
        class {
          id
          name
        }
      }
      student {
        id
        pseudo
      }
    }
  }
`;

const UPDATE_GRADE = gql`
  mutation UpdateGrade($id: ID!, $value: Float!, $comment: String) {
    updateGrade(id: $id, value: $value, comment: $comment) {
      id
      value
      comment
      date
      course {
        id
        name
        class {
          id
          name
        }
      }
      student {
        id
        pseudo
      }
    }
  }
`;

const DELETE_GRADE = gql`
  mutation DeleteGrade($id: ID!) {
    deleteGrade(id: $id)
  }
`;

const Grades = () => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [formData, setFormData] = useState({
    value: '',
    comment: '',
    courseId: '',
    studentId: '',
  });
  const [availableStudents, setAvailableStudents] = useState([]);

  const { loading, error, data, refetch } = useQuery(GET_GRADES_DATA, {
    fetchPolicy: 'network-only'
  });
  const [createGrade] = useMutation(CREATE_GRADE, {
    onCompleted: () => refetch()
  });
  const [updateGrade] = useMutation(UPDATE_GRADE, {
    onCompleted: () => refetch()
  });
  const [deleteGrade] = useMutation(DELETE_GRADE, {
    onCompleted: () => refetch()
  });

  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'courseId') {
      setFormData(prev => ({ ...prev, studentId: '' }));
      if (value && data) {
        const selectedCourse = data.courses.find(c => c.id === value);
        if (selectedCourse?.class?.students) {
          setAvailableStudents(selectedCourse.class.students);
        } else {
          setAvailableStudents([]);
        }
      } else {
        setAvailableStudents([]);
      }
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditingGrade(null);
    setFormData({ value: '', comment: '', courseId: '', studentId: '' });
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      value: grade.value,
      comment: grade.comment || '',
      courseId: grade.course.id,
      studentId: grade.student.id,
    });
    setOpen(true);
  };

  const handleDeleteClick = (grade) => {
    setSelectedGrade(grade);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteGrade({
        variables: { id: selectedGrade.id },
      });
      setDeleteConfirmOpen(false);
      setSelectedGrade(null);
    } catch (err) {
      console.error('Error deleting grade:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gradeData = {
        ...formData,
        value: parseFloat(formData.value),
      };

      if (editingGrade) {
        await updateGrade({
          variables: {
            id: editingGrade.id,
            value: gradeData.value,
            comment: gradeData.comment,
          },
        });
      } else {
        await createGrade({
          variables: gradeData,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Error saving grade:', err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Grades</Typography>
        </Grid>
        <Grid item>
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Filter by Course</InputLabel>
            <Select
              value={selectedCourseFilter}
              label="Filter by Course"
              onChange={(e) => {
                setSelectedCourseFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {data?.courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {isProfessor && (
          <Grid item>
            <Button 
              variant="contained" 
              onClick={handleOpen}
              startIcon={<AddIcon />}
            >
              Add New Grade
            </Button>
          </Grid>
        )}
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Class</TableCell>
                {isProfessor && <TableCell>Student</TableCell>}
                <TableCell align="center">Grade</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
                {isProfessor && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                let grades = [];
                if (isProfessor && data?.courses) {
                  // Pour les professeurs, récupérer toutes les notes de tous les étudiants
                  data.courses.forEach(course => {
                    if (course.class?.students) {
                      course.class.students.forEach(student => {
                        if (student.grades) {
                          grades.push(...student.grades);
                        }
                      });
                    }
                  });
                } else if (data?.myGrades) {
                  // Pour les étudiants, utiliser leurs propres notes
                  grades = data.myGrades;
                }
                
                return grades
                  .filter(grade => !selectedCourseFilter || grade.course.id === selectedCourseFilter)
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>{grade.course.name}</TableCell>
                    <TableCell>{grade.course.class?.name}</TableCell>
                    {isProfessor && <TableCell>{grade.student.pseudo}</TableCell>}
                    <TableCell align="center">
                      <Chip
                        label={`${grade.value}/20`}
                        color={grade.value >= 10 ? "success" : "error"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{grade.comment || '-'}</TableCell>
                    <TableCell>{new Date(parseInt(grade.date)).toLocaleDateString()}</TableCell>
                    {isProfessor && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(grade)}
                            color="primary"
                            title="Edit grade"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(grade)}
                            color="error"
                            title="Delete grade"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ));
              })()} 
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={
            isProfessor
              ? data?.courses?.reduce(
                  (total, course) =>
                    total +
                    (course.class?.students?.reduce(
                      (studentTotal, student) => studentTotal + (student.grades?.length || 0),
                      0
                    ) || 0),
                  0
                ) || 0
              : data?.myGrades?.length || 0
          }
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Course</InputLabel>
            <Select
              name="courseId"
              value={formData.courseId}
              label="Course"
              onChange={handleInputChange}
            >
              {data.courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Student</InputLabel>
            <Select
              name="studentId"
              value={formData.studentId}
              label="Student"
              onChange={handleInputChange}
              disabled={!formData.courseId}
            >
              {availableStudents.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.pseudo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Grade Value"
            type="number"
            fullWidth
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            inputProps={{
              min: 0,
              max: 20,
              step: 0.5
            }}
            error={formData.value < 0 || formData.value > 20}
            helperText={formData.value < 0 || formData.value > 20 ? 'Grade must be between 0 and 20' : ''}
          />

          <TextField
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={editingGrade ? <EditIcon /> : <AddIcon />}
            disabled={!formData.value || (formData.value < 0 || formData.value > 20) || (!editingGrade && (!formData.courseId || !formData.studentId))}
          >
            {editingGrade ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Grade</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this grade?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Grades;
