// Helper function to calculate grade statistics
const calculateGradeStats = (grades) => {
  if (!grades || grades.length === 0) {
    return {
      average: null,
      median: null,
      lowest: null,
      highest: null,
      count: 0,
    };
  }

  const values = grades.map(grade => grade.value).sort((a, b) => a - b);
  const count = values.length;
  const lowest = values[0];
  const highest = values[count - 1];
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / count;

  // Calculate median
  let median;
  if (count % 2 === 0) {
    median = (values[count / 2 - 1] + values[count / 2]) / 2;
  } else {
    median = values[Math.floor(count / 2)];
  }

  return {
    average,
    median,
    lowest,
    highest,
    count,
  };
};

module.exports = {
  calculateGradeStats,
};
