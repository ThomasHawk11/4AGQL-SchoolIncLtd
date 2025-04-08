import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Container, Grid, Paper, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '../components/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    me {
      id
      pseudo
      role
    }
    classes {
      id
      name
      students {
        id
        pseudo
      }
      courses {
        id
        name
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
      }
    }
  }
`;

const Dashboard = () => {
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);
  const { user } = useAuth();

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  const isProfessor = user?.role === 'professor';

  // Préparer les données pour le graphique des notes
  const grades = data.myGrades || [];
  const courseGrades = {};
  grades.forEach(grade => {
    if (!courseGrades[grade.course.name]) {
      courseGrades[grade.course.name] = [];
    }
    courseGrades[grade.course.name].push(grade.value);
  });

  const chartData = {
    labels: Object.keys(courseGrades),
    datasets: [{
      label: 'Average Grade',
      data: Object.values(courseGrades).map(grades => {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        return Math.round(avg * 10) / 10;
      }),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Grades by Course',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.pseudo}!
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Classes Overview
            </Typography>
            {data.classes.map((class_) => (
              <Box key={class_.id} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {class_.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    size="small"
                    label={`${class_.students?.length || 0} Students`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${class_.courses?.length || 0} Courses`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Grades
            </Typography>
            {grades.slice(0, 5).map((grade) => (
              <Box key={grade.id} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>{grade.course.name}</Typography>
                <Chip
                  label={`${grade.value}/20`}
                  color={grade.value >= 10 ? "success" : "error"}
                  variant="outlined"
                  size="small"
                />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: 300 }}>
              <Bar data={chartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
