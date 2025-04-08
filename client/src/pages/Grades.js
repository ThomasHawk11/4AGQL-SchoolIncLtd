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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';

const GET_GRADES_DATA = gql`
  query GetGradesData {
    me {
      id
      role
    }
    users {
      id
      pseudo
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
      }
      student {
        id
        pseudo
      }
    }
  }
`;

const Grades = () => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    value: '',
    comment: '',
    courseId: '',
    studentId: '',
  });
  const [availableStudents, setAvailableStudents] = useState([]);

  const { loading, error, data } = useQuery(GET_GRADES_DATA);
  const [createGrade] = useMutation(CREATE_GRADE, {
    refetchQueries: [{ query: GET_GRADES_DATA }],
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

  useEffect(() => {
    if (formData.courseId && data) {
      const selectedCourse = data.courses.find(c => c.id === formData.courseId);
      if (selectedCourse?.class?.students) {
        setAvailableStudents(selectedCourse.class.students);
      } else {
        setAvailableStudents([]);
      }
    } else {
      setAvailableStudents([]);
    }
  }, [formData.courseId, data]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createGrade({
        variables: {
          ...formData,
          value: parseFloat(formData.value),
        },
      });
      handleClose();
      setFormData({ value: '', comment: '', courseId: '', studentId: '' });
    } catch (err) {
      console.error('Error creating grade:', err);
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
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.myGrades
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
                    <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.myGrades?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Grade</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Course</InputLabel>
            <Select
              value={formData.courseId}
              label="Course"
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value, studentId: '' })}
            >
              {data?.courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name} - {course.class?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" disabled={!formData.courseId}>
            <InputLabel>Student</InputLabel>
            <Select
              value={formData.studentId}
              label="Student"
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
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
            label="Grade (0-20)"
            type="number"
            fullWidth
            value={formData.value}
            onChange={(e) => {
              const value = Math.min(20, Math.max(0, parseFloat(e.target.value)));
              setFormData({ ...formData, value: value });
            }}
            inputProps={{ min: "0", max: "20", step: "0.5" }}
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.courseId || !formData.studentId || formData.value === ''}
          >
            Add Grade
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Grades;
