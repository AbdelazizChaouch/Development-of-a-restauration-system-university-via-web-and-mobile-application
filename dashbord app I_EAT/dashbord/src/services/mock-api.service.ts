import { Student } from './api.service';

// Mock delay to simulate API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock student data
const mockStudents: Student[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@university.edu',
    department: 'Computer Science',
    year: 3,
    status: 'active',
    university_id: 1,
    university_name: 'Tech University'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    department: 'Engineering',
    year: 2,
    status: 'active',
    university_id: 1,
    university_name: 'Tech University'
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert.j@university.edu',
    department: 'Business',
    year: 4,
    status: 'inactive',
    university_id: 2,
    university_name: 'Business School'
  },
  {
    id: 4,
    name: 'Emma Wilson',
    email: 'emma.w@university.edu',
    department: 'Medicine',
    year: 1,
    status: 'active',
    university_id: 3,
    university_name: 'Medical Institute'
  },
  {
    id: 5,
    name: 'Michael Brown',
    email: 'michael.b@university.edu',
    department: 'Arts',
    year: 3,
    status: 'active',
    university_id: 4,
    university_name: 'Arts Academy'
  },
  {
    id: 6,
    name: 'Sarah Davis',
    email: 'sarah.d@university.edu',
    department: 'Science',
    year: 2,
    status: 'pending',
    university_id: 1,
    university_name: 'Tech University'
  },
  {
    id: 7,
    name: 'James Wilson',
    email: 'james.w@university.edu',
    department: 'Mathematics',
    year: 3,
    status: 'active',
    university_id: 5,
    university_name: 'Science Institute'
  },
  {
    id: 8,
    name: 'Linda Miller',
    email: 'linda.m@university.edu',
    department: 'Psychology',
    year: 4,
    status: 'inactive',
    university_id: 6,
    university_name: 'Psychology College'
  }
];

// Mock Student API
export const MockStudentApi = {
  // Get all students
  getAll: async (): Promise<Student[]> => {
    // Simulate network delay
    await delay(800);
    return [...mockStudents];
  },
  
  // Get student by ID
  getById: async (id: number): Promise<Student> => {
    await delay(500);
    const student = mockStudents.find(s => s.id === id);
    if (!student) {
      throw new Error('Student not found');
    }
    return { ...student };
  },
  
  // Create a new student
  create: async (studentData: Omit<Student, 'id'>): Promise<Student> => {
    await delay(700);
    const newStudent = {
      ...studentData,
      id: Math.max(...mockStudents.map(s => s.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { ...newStudent };
  },
  
  // Update a student
  update: async (id: number, studentData: Partial<Student>): Promise<Student> => {
    await delay(600);
    const studentIndex = mockStudents.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    const updatedStudent = {
      ...mockStudents[studentIndex],
      ...studentData,
      updated_at: new Date().toISOString()
    };
    return { ...updatedStudent };
  },
  
  // Delete a student
  delete: async (id: number): Promise<void> => {
    await delay(500);
    const studentIndex = mockStudents.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    // In a real implementation, we would remove the student from the array
  }
};

// Export default
export default {
  students: MockStudentApi
}; 