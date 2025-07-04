import axios from 'axios';

// Define API base URL
const API_URL = 'http://localhost:5000/api';

// Define mock users for testing without backend
export const MOCK_USERS = [
  {
    id: "c20d7dc0-fee3-11ef-a93a-2cf05db4a17f",
    name: "Alice Admin",
    email: "alice@example.com",
    password: "hashed_password1", // In a real app, these would be properly hashed
    role: "admin",
    avatar: "alice.png",
    created_at: "2025-03-12T01:46:03.000Z",
    updated_at: "2025-03-12T01:46:03.000Z",
    permissions: [
      { id: 1, name: 'view_dashboard', description: 'Can view dashboard' },
      { id: 2, name: 'manage_users', description: 'Can manage users' },
      { id: 3, name: 'manage_food', description: 'Can manage food items' },
      { id: 4, name: 'manage_orders', description: 'Can manage orders' },
      { id: 5, name: 'manage_tickets', description: 'Can manage tickets' }
    ]
  },
  {
    id: "c20f599b-fee3-11ef-a93a-2cf05db4a17f",
    name: "Bob Staff",
    email: "bob@example.com",
    password: "hashed_password2",
    role: "staff",
    avatar: "bob.png",
    created_at: "2025-03-12T01:46:03.000Z",
    updated_at: "2025-03-12T01:46:03.000Z",
    permissions: [
      { id: 1, name: 'view_dashboard', description: 'Can view dashboard' },
      { id: 3, name: 'manage_food', description: 'Can manage food items' },
      { id: 4, name: 'manage_orders', description: 'Can manage orders' }
    ]
  },
  {
    id: "c20f5c07-fee3-11ef-a93a-2cf05db4a17f",
    name: "Charlie Viewer",
    email: "charlie@example.com",
    password: "hashed_password3",
    role: "viewer",
    avatar: "charlie.png",
    created_at: "2025-03-12T01:46:03.000Z",
    updated_at: "2025-03-12T01:46:03.000Z",
    permissions: [
      { id: 1, name: 'view_dashboard', description: 'Can view dashboard' }
    ]
  }
];

// Environment flag to use mock data instead of real API
export const USE_MOCK_DATA = false;

// Define user interface based on backend model
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
}

// Token storage helpers
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// User storage helpers
export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
    return null;
  }
};

export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

// Mock login function
const mockLogin = async (email: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Find user with matching email and password
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  
  if (user) {
    // Clone user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
  
  throw new Error('Invalid email or password');
};

// Login function
export const login = async (email: string, password: string): Promise<User> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock login
      const user = await mockLogin(email, password);
      
      // Store user in localStorage
      setUser(user);
      
      // Generate a fake token that includes user ID and role
      const fakeToken = btoa(`${user.id}:${user.role}:${new Date().getTime()}`);
      setToken(fakeToken);
      
      // Add user ID and role to authAxios defaults
      authAxios.defaults.headers.common['X-User-ID'] = user.id;
      authAxios.defaults.headers.common['X-User-Role'] = user.role;
      
      return user;
    } else {
      // Use real API
      console.log('Attempting to login with real API:', { email });
      
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      console.log('Login response:', response.data);
      
      if (response.data?.user) {
        const user = response.data.user;
        
        // Ensure the user has the required fields
        if (!user.id || !user.role) {
          console.error('Invalid user data received:', user);
          throw new Error('Invalid user data received from server');
        }
        
        // Store user in localStorage
        setUser(user);
        
        // Generate a token (in a real app, this would come from the backend)
        const token = btoa(`${user.id}:${user.role}:${new Date().getTime()}`);
        setToken(token);
        
        // Add user ID and role to authAxios defaults
        authAxios.defaults.headers.common['X-User-ID'] = user.id;
        authAxios.defaults.headers.common['X-User-Role'] = user.role;
        
        console.log('User logged in successfully:', { 
          id: user.id, 
          name: user.name, 
          role: user.role 
        });
        
        return user;
      }
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw error;
  }
};

// Logout function
export const logout = (): void => {
  removeToken();
  removeUser();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

// Get user permissions
export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  try {
    if (USE_MOCK_DATA) {
      // Find user from mock data
      const user = MOCK_USERS.find((u) => u.id === userId);
      return user?.permissions || [];
    } else {
      // Use real API
      const response = await axios.get(`${API_URL}/users/${userId}/permissions`);
      return response.data.permissions || [];
    }
  } catch (error) {
    console.error('Failed to fetch user permissions', error);
    return [];
  }
};

// Create an axios instance with authorization headers
export const authAxios = axios.create({
  baseURL: API_URL,
});

// Add authorization header to all requests
authAxios.interceptors.request.use(
  (config) => {
    const token = getToken();
    const user = getUser();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Always include user ID and role if available
    if (user) {
      config.headers['X-User-ID'] = user.id;
      config.headers['X-User-Role'] = user.role;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout if 401 response returned from api
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
); 