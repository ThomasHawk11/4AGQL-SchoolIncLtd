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

const Grades = () => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
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
        <DialogTitle>Add New Grade</DialogTitle>
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
