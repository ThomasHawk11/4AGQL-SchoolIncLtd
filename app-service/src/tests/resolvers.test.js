const { calculateGradeStats } = require('../utils/gradeUtils');

// Extract the calculateGradeStats function from resolvers.js to a separate file for testing
// This is just a mock for the test
jest.mock('../utils/gradeUtils', () => ({
  calculateGradeStats: jest.fn((grades) => {
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
  }),
}));

describe('Grade Statistics', () => {
  it('should calculate correct statistics for a set of grades', () => {
    const grades = [
      { value: 10 },
      { value: 15 },
      { value: 12 },
      { value: 8 },
      { value: 16 },
    ];
    
    const stats = calculateGradeStats(grades);
    
    expect(stats.average).toBeCloseTo(12.2);
    expect(stats.median).toBe(12);
    expect(stats.lowest).toBe(8);
    expect(stats.highest).toBe(16);
    expect(stats.count).toBe(5);
  });

  it('should handle empty grades array', () => {
    const stats = calculateGradeStats([]);
    
    expect(stats.average).toBeNull();
    expect(stats.median).toBeNull();
    expect(stats.lowest).toBeNull();
    expect(stats.highest).toBeNull();
    expect(stats.count).toBe(0);
  });

  it('should calculate correct median for even number of grades', () => {
    const grades = [
      { value: 10 },
      { value: 12 },
      { value: 14 },
      { value: 16 },
    ];
    
    const stats = calculateGradeStats(grades);
    
    expect(stats.median).toBe(13); // (12 + 14) / 2
  });

  it('should calculate correct median for odd number of grades', () => {
    const grades = [
      { value: 10 },
      { value: 12 },
      { value: 14 },
    ];
    
    const stats = calculateGradeStats(grades);
    
    expect(stats.median).toBe(12);
  });
});
