// API base URL
// Change this if your backend is running on a different port or host
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

console.log('API service initialized with base URL:', API_BASE_URL);

// Interface for API error responses
interface ApiError {
  message: string;
  errors?: any;
  status?: number;
}

// Base fetch function with error handling
export async function fetchFromApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`, options.method || 'GET');
  
  try {
    // Add authentication headers to all requests
    const userJson = localStorage.getItem('user');
    let authHeaders = {};
    
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        console.log('User data from localStorage:', userData);
        
        if (userData && userData.id) {
          authHeaders = {
            'X-User-ID': userData.id.toString(),
            'X-User-Role': userData.role || 'staff'
          };
          console.log('Adding auth headers to request:', authHeaders);
        } else {
          console.warn('User data found in localStorage but missing ID or role:', userData);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    } else {
      console.warn('No user data found in localStorage');
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    };
    
    console.log('Final request headers:', headers);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`Response from ${endpoint}:`, response.status, response.statusText);

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        message: 'An error occurred while connecting to the server'
      }));
      
      console.error('Error response data:', errorData);
      
      throw {
        ...errorData,
        status: response.status,
        message: errorData.message || `Error: ${response.status} ${response.statusText}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Student backend interface matching the actual database schema
interface StudentBackend {
  student_id: number;
  cn?: string;
  full_name?: string;
  profile_img?: string;
  card_id?: number; // This is an integer reference to university_cards
  university_id?: number;
  orders_id?: number;
  ticket_id?: number;
  code_qr?: string;
  created_at?: string;
  updated_at?: string;
  university_description?: string;
  // User tracking fields
  created_by?: string;
  updated_by?: string;
  // Card related fields
  card_number?: string; // From university_cards table
  balance?: number; // From university_cards table (sold field)
}

// University Card interface
interface UniversityCard {
  card_id: number;
  student_id: number;
  sold: number;
  card_number: string;
  used: boolean;
  card_number_sold?: number;
  history?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Student frontend interface (used in our components)
export interface Student {
  id: number;
  name: string;
  cn?: string;
  profileImage?: string;
  status: string;
  university_id?: number;
  orders_id?: number;
  ticket_id?: number;
  qrCode?: string;
  created_at?: string;
  updated_at?: string;
  university_name?: string;
  balance?: number; // Student's account balance
  card_id?: string; // Card number from the university_cards table
}

// Mock student data for the demo
// This would be managed by the backend in a real application
const mockStudents: Student[] = [
  {
    id: 10001,
    name: 'John Smith',
    cn: 'CN2023001',
    status: 'active',
    university_id: 1,
    card_id: 'CARD12345',
    university_name: 'University of Technology',
    balance: 125.50,
    created_at: '2023-01-15T10:30:00Z',
    qrCode: JSON.stringify({
      student_id: 10001,
      cn: 'CN2023001',
      full_name: 'John Smith',
      card_id: 'CARD12345',
      university_id: 1
    })
  },
  {
    id: 20045,
    name: 'Sarah Johnson',
    cn: 'CN2023002',
    status: 'active',
    university_id: 1,
    card_id: 'UNIV54321',
    university_name: 'University of Technology',
    balance: 75.25,
    created_at: '2023-01-20T11:15:00Z',
    qrCode: JSON.stringify({
      student_id: 20045,
      cn: 'CN2023002',
      full_name: 'Sarah Johnson',
      card_id: 'UNIV54321',
      university_id: 1
    })
  },
  {
    id: 30721,
    name: 'Michael Chen',
    cn: 'CN2023003',
    status: 'active',
    university_id: 2,
    card_id: 'STUD98765',
    university_name: 'State University',
    balance: 50.00,
    created_at: '2023-02-05T09:45:00Z',
    qrCode: JSON.stringify({
      student_id: 30721,
      cn: 'CN2023003',
      full_name: 'Michael Chen',
      card_id: 'STUD98765',
      university_id: 2
    })
  }
];

// Function to convert backend student model to frontend model
function mapBackendToFrontend(student: StudentBackend): Student {
  if (!student) {
    console.error('Received empty student data from API');
    // Return a placeholder student object if data is missing
    return {
      id: 0,
      name: 'Unknown Student',
      status: 'inactive',
      balance: 0
    };
  }

  console.log('Mapping student data:', student);

  // Map fields from backend to frontend, adding placeholder values for frontend-only fields
  return {
    id: student.student_id || 0,
    name: student.full_name || 'Unknown Student',
    cn: student.cn?.toString(),
    profileImage: student.profile_img,
    status: 'active', // Frontend only
    university_id: student.university_id,
    card_id: student.card_number, // Use card_number from university_cards
    orders_id: student.orders_id,
    ticket_id: student.ticket_id,
    qrCode: student.code_qr, // This should already be a JSON string from the backend
    created_at: student.created_at,
    updated_at: student.updated_at,
    university_name: student.university_description,
    balance: student.balance || 0
  };
}

// Function to generate a unique card number
function generateUniqueCardNumber(): string {
  // Generate 4 random uppercase letters
  const letters = Array.from({ length: 4 }, () => 
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  
  // Generate 5 random digits
  const digits = Array.from({ length: 5 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
  
  return letters + digits;
}

// Function to generate QR code (this will be replaced by the actual API call)
function generateQRCode(studentId: number, studentName: string): string {
  // In a real implementation, this would call an API to generate a QR code
  // Here we're just returning a placeholder URL
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STUDENT:${studentId}:${encodeURIComponent(studentName)}`;
}

// Download history interface
export interface DownloadRecord {
  id?: number;
  student_id: number;
  user_id: number;
  download_date: string;
  download_type: string;
}

// Function to get the currently logged in user ID
function getCurrentUserId(): string | null {
  try {
    // Try to get the user from localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    return user.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Student API functions
export const StudentApi = {
  // Get all students
  getAll: async (): Promise<Student[]> => {
    try {
      console.log('Attempting to fetch all students from API');
      // Add a timeout to the fetch operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out after 5 seconds')), 5000);
      });
      
      // Connect to the real API endpoint with timeout
      const fetchPromise = fetchFromApi<any>('/students');
      
      // Race between the fetch and the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log(`Successfully retrieved ${response.length} students`);
        return response.map(mapBackendToFrontend);
      } else if (response && response.students && Array.isArray(response.students)) {
        console.log(`Successfully retrieved ${response.students.length} students`);
        return response.students.map(mapBackendToFrontend);
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log(`Successfully retrieved ${response.data.length} students from 'data' property`);
        return response.data.map(mapBackendToFrontend);
      } else {
        console.error('Unexpected API response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },
  
  // Get student by ID
  getById: async (id: number): Promise<Student> => {
    const student = await fetchFromApi<StudentBackend>(`/students/${id}`);
    return mapBackendToFrontend(student);
  },
  
  // Get student with university details
  getWithUniversity: async (id: number): Promise<Student> => {
    const student = await fetchFromApi<StudentBackend>(`/students/${id}/university`);
    return mapBackendToFrontend(student);
  },
  
  // Create a new student
  create: async (studentData: Partial<Student>): Promise<Student> => {
    try {
      console.log('Creating student with data:', studentData);
      
      // Validate student ID
      const studentIdString = String(studentData.id);
      if (!studentData.id || studentIdString.length !== 5 || !/^\d{5}$/.test(studentIdString)) {
        throw new Error('Student ID must be exactly 5 digits');
      }
      
      // Validate CN if provided (must be exactly 8 digits)
      if (studentData.cn && !/^\d{8}$/.test(studentData.cn)) {
        throw new Error('CN must be exactly 8 digits');
      }
      
      // Get the current user ID for tracking who created the student/card
      const currentUserId = getCurrentUserId();
      
      // Prepare the backend data object with the correct field types
      const backendData: Partial<StudentBackend> = {
        student_id: studentData.id,
        cn: studentData.cn,
        full_name: studentData.name,
        profile_img: studentData.profileImage,
        university_id: studentData.university_id,
        // Include metadata about who is creating this student
        created_by: currentUserId || undefined,
      };
      
      let usedFallback = false;
      let createdStudent: Student;
      
      try {
        // The backend now creates both the student and a university card in a transaction
        // and updates the card_id in the student record
        const response = await fetchFromApi<StudentBackend>('/students', {
          method: 'POST',
          body: JSON.stringify(backendData),
        });
        
        console.log('Student created successfully with data:', response);
        
        // Convert the result to our frontend model
        createdStudent = mapBackendToFrontend({
          ...response
        });
      } catch (apiError) {
        console.error('API error creating student:', apiError);
        
        // Check if this is a duplicate student ID error
        const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
        console.log('API error message:', errorMsg);
        
        // Check for duplicate errors and always throw them, never use fallback for duplicates
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          console.log('Detected duplicate error - throwing to caller');
          throw new Error(errorMsg);
        }
        
        // Only use fallback for other errors, not for duplicate student ID errors
        console.log('Using fallback method to create student for non-duplicate error');
        usedFallback = true;
        
        // Generate a unique card number (4 letters + 5 digits)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let cardPrefix = '';
        for (let i = 0; i < 4; i++) {
          cardPrefix += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        const cardNumber = `${cardPrefix}${String(Math.floor(10000 + Math.random() * 90000))}`;
        
        // Create QR code data
        const qrData = {
          student_id: studentData.id,
          cn: studentData.cn || '',
          full_name: studentData.name || '',
          card_number: cardNumber,
          university_id: studentData.university_id || 0
        };
        
        // Create a complete student object
        createdStudent = {
          id: studentData.id!,
          name: studentData.name || 'Unnamed Student',
          cn: studentData.cn,
          profileImage: studentData.profileImage,
          status: 'active',
          university_id: studentData.university_id,
          card_id: cardNumber,
          qrCode: JSON.stringify(qrData),
          created_at: new Date().toISOString(),
          balance: 0
        };
      }
      
      // Only add to mockStudents array if we used the fallback
      if (usedFallback) {
        // Add to our mock data (for this session only)
        mockStudents.unshift(createdStudent);
      }
      
      return createdStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error instanceof Error ? error : new Error('Failed to create student');
    }
  },
  
  // Update a student
  update: async (id: number, studentData: Partial<Student>): Promise<Student> => {
    try {
      // Get the current user ID for tracking who updated the student
      const currentUserId = getCurrentUserId();
      
      // Convert frontend model to backend model
      const backendData: Partial<StudentBackend> = {};
      
      if (studentData.name) backendData.full_name = studentData.name;
      if (studentData.cn) backendData.cn = studentData.cn;
      if (studentData.profileImage) backendData.profile_img = studentData.profileImage;
      if (studentData.university_id) backendData.university_id = studentData.university_id;
      
      // Add the user who is making this update - ensure it's an integer
      if (currentUserId) {
        try {
          // Try to parse as integer if possible
          const userId = parseInt(currentUserId);
          if (!isNaN(userId)) {
            backendData.updated_by = userId.toString();
          } else {
            console.warn('User ID is not a valid integer, omitting updated_by field:', currentUserId);
            // Don't set updated_by if it's not a valid integer
          }
        } catch (e) {
          console.warn('Error parsing user ID, omitting updated_by field:', e);
          // Don't set updated_by if there's an error
        }
      }
      
      // Don't update card_id directly through this method
      // Card ID should only be set when a university card is created
      // If card ID needs to be updated, it should be done through the university card API
      
      console.log('Sending update request for student:', id, backendData);
      
      const response = await fetchFromApi<{success: boolean; message: string; data: StudentBackend}>(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
      
      console.log('Update response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update student');
      }
      
      return mapBackendToFrontend(response.data);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error instanceof Error ? error : new Error('Failed to update student');
    }
  },
  
  // Delete a student
  delete: async (id: number): Promise<void> => {
    // Get the current user ID for tracking who deleted the student
    const currentUserId = getCurrentUserId();
    
    // Include the user ID in the request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (currentUserId) {
      headers['X-User-ID'] = String(currentUserId);
    }
    
    return fetchFromApi<void>(`/students/${id}`, {
      method: 'DELETE',
      headers
    });
  },
  
  // Generate and print QR code
  printQRCode: async (studentId: number): Promise<Blob> => {
    try {
      // In a real implementation, this would call an API endpoint to generate and return a printable QR code
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/qrcode/print`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code for printing');
      }
      return await response.blob();
    } catch (error) {
      console.error('Error printing QR code:', error);
      throw error;
    }
  },

  // Get QR code URL for a student
  getQRCodeUrl: (studentId: number, student: Student): string => {
    // Check if the student already has a QR code from the backend
    if (student.qrCode) {
      try {
        // Try to parse the QR code data if it's a string
        const parsedQrData = typeof student.qrCode === 'string' 
          ? JSON.parse(student.qrCode) 
          : student.qrCode;
          
        console.log('Using existing QR code data:', parsedQrData);
        
        // Convert the data to a JSON string and encode for the URL
        const encodedData = encodeURIComponent(JSON.stringify(parsedQrData));
        
        // Return the URL for the QR code generation service
        return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodedData}`;
      } catch (error) {
        console.error('Failed to parse existing QR code data:', error);
        // Continue to fallback if parsing fails
      }
    }
    
    // Create a data object with all required fields as fallback
    const qrData = {
      student_id: student.id,
      cn: student.cn || '',
      full_name: student.name || '',
      card_id: student.card_id || '',
      university_id: student.university_id || 0
    };
    
    console.log('Using fallback QR code data:', qrData);
    
    // Convert the data object to a JSON string and encode for the URL
    const encodedData = encodeURIComponent(JSON.stringify(qrData));
    
    // Return the URL for the QR code generation service
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodedData}`;
  },
  
  // Add a function to log download history
  logDownload: async (studentId: number, downloadType: string): Promise<DownloadRecord> => {
    try {
      // Get current user ID (normally would come from authentication)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{"id": 1}');
      const userId = currentUser.id;
      
      const downloadRecord: DownloadRecord = {
        student_id: studentId,
        user_id: userId,
        download_date: new Date().toISOString(),
        download_type: downloadType
      };
      
      // In a real application, we would send this to an endpoint
      // For now, just return a mock response
      return {
        ...downloadRecord,
        id: Math.floor(Math.random() * 10000)
      };
    } catch (error) {
      console.error('Failed to log download:', error);
      throw error;
    }
  },
  
  // Get download history for a student
  getDownloadHistory: async (studentId: number): Promise<DownloadRecord[]> => {
    try {
      // In a full implementation, you would fetch from an endpoint
      // For now, return mock data
      return [
        {
          id: 1,
          student_id: studentId,
          user_id: 1,
          download_date: new Date(Date.now() - 3600000).toISOString(),
          download_type: 'QR Code'
        },
        {
          id: 2,
          student_id: studentId,
          user_id: 2,
          download_date: new Date(Date.now() - 86400000).toISOString(),
          download_type: 'QR Code'
        }
      ];
    } catch (error) {
      console.error('Failed to get download history:', error);
      return [];
    }
  },

  // Test authentication
  testAuth: async (): Promise<any> => {
    try {
      console.log('Testing authentication...');
      
      // Get the current user for logging
      const userJson = localStorage.getItem('user');
      const currentUser = userJson ? JSON.parse(userJson) : null;
      
      console.log('Current user for auth test:', currentUser);
      
      // Make the API call - auth headers are added automatically in fetchFromApi
      const response = await fetchFromApi<any>('/auth-test');
      
      console.log('Auth test response:', JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error('Authentication test failed:', error);
      throw error;
    }
  },
};

// University Card API functions
export const UniversityCardApi = {
  // Get all university cards
  getAll: async (): Promise<UniversityCard[]> => {
    try {
      const response = await fetchFromApi<{cards: UniversityCard[]}>('/cards');
      return response.cards || [];
    } catch (error) {
      console.error('Error fetching all university cards:', error);
      throw error;
    }
  },
  
  // Get card by ID
  getById: async (cardId: number): Promise<UniversityCard> => {
    try {
      const card = await fetchFromApi<UniversityCard>(`/university-cards/${cardId}`);
      return card;
    } catch (error) {
      console.error(`Error fetching university card ${cardId}:`, error);
      throw error;
    }
  },
  
  // Update card balance
  updateBalance: async (cardId: number, amount: number): Promise<UniversityCard> => {
    try {
      // Get the current user ID
      const currentUserId = getCurrentUserId();
      
      const updateData = {
        sold: amount,
        updated_by: currentUserId || undefined
      };
      
      const updatedCard = await fetchFromApi<UniversityCard>(`/university-cards/${cardId}/balance`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return updatedCard;
    } catch (error) {
      console.error(`Error updating university card ${cardId} balance:`, error);
      throw error;
    }
  },
  
  // Add funds to card
  addFunds: async (cardId: number, amount: number): Promise<UniversityCard> => {
    try {
      console.log(`Adding funds to card ${cardId}, amount: ${amount}`);
      
      // Get the current user for logging
      const userJson = localStorage.getItem('user');
      const currentUser = userJson ? JSON.parse(userJson) : null;
      
      if (!currentUser || !currentUser.id) {
        console.error('No authenticated user found in localStorage');
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('Current user for add funds operation:', currentUser);
      
      // Prepare request data
      const requestData = {
        amount: amount,
        operation: 'add'
      };
      
      // Make the API call - auth headers are added automatically in fetchFromApi
      const response = await fetchFromApi<any>(`/university-cards/${cardId}/balance`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
      
      console.log('Add funds response:', JSON.stringify(response, null, 2));
      
      // Check if the response has the expected structure
      if (!response) {
        console.error('Empty response received');
        throw new Error('Empty response from server');
      }
      
      // Return the updated card data
      if (response.data) {
        return response.data;
      } else if (response.success) {
        return response;
      } else {
        console.warn('Unexpected response format:', response);
        // Return a minimal object with the new balance
        return {
          card_id: cardId,
          sold: amount,
          new_balance: amount
        } as any;
      }
    } catch (error) {
      console.error(`Error adding funds to university card ${cardId}:`, error);
      throw error;
    }
  },
  
  // Subtract funds from card (admin only)
  subtractFunds: async (cardId: number, amount: number): Promise<UniversityCard> => {
    try {
      console.log(`Subtracting funds from card ${cardId}, amount: ${amount}`);
      
      // Get the current user to check role
      const userJson = localStorage.getItem('user');
      const currentUser = userJson ? JSON.parse(userJson) : null;
      
      // Check if user is admin
      if (!currentUser || currentUser.role !== 'admin') {
        console.error('Permission denied: Only administrators can subtract funds');
        throw new Error('Only administrators can subtract funds from cards');
      }
      
      console.log('Current user for subtract funds operation:', currentUser);
      
      // Prepare request data
      const requestData = {
        amount: amount,
        operation: 'subtract'
      };
      
      // Make the API call - auth headers are added automatically in fetchFromApi
      const response = await fetchFromApi<any>(`/university-cards/${cardId}/balance`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
      
      console.log('Subtract funds response:', JSON.stringify(response, null, 2));
      
      // Check if the response has the expected structure
      if (!response) {
        console.error('Empty response received');
        throw new Error('Empty response from server');
      }
      
      // Return the updated card data
      if (response.data) {
        return response.data;
      } else if (response.success) {
        return response;
      } else {
        console.warn('Unexpected response format:', response);
        // Return a minimal object with the new balance
        return {
          card_id: cardId,
          sold: amount,
          new_balance: amount
        } as any;
      }
    } catch (error) {
      console.error(`Error subtracting funds from university card ${cardId}:`, error);
      throw error;
    }
  },
  
  // Get card by student ID
  getByStudentId: async (studentId: number): Promise<UniversityCard> => {
    try {
      const card = await fetchFromApi<UniversityCard>(`/university-cards/student/${studentId}`);
      return card;
    } catch (error) {
      console.error(`Error fetching university card for student ${studentId}:`, error);
      throw error;
    }
  }
};

// Export other API services as needed (will be expanded later)
export default {
  students: StudentApi,
  cards: UniversityCardApi,
}; 

// Make sure we export the authAxios instance for components that need it
export const authAxios = axios.create({
  baseURL: API_BASE_URL
});

authAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['x-auth-token'] = token;
    }
    
    // Add user ID and role to headers
    const userJson = localStorage.getItem('user');
    if (userJson && config.headers) {
      try {
        const userData = JSON.parse(userJson);
        if (userData && userData.id) {
          config.headers['X-User-ID'] = userData.id;
          config.headers['X-User-Role'] = userData.role || 'staff';
          console.log('Adding auth headers to request:', {
            'X-User-ID': userData.id,
            'X-User-Role': userData.role || 'staff'
          });
        } else {
          console.warn('User data found in localStorage but missing ID or role:', userData);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    } else {
      console.warn('No user data found in localStorage');
    }
    
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
); 