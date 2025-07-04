import React, { useState, useEffect } from 'react';
import PageTemplate from '../components/PageTemplate';
import { FaSearch, FaSpinner, FaExclamationTriangle, FaPencilAlt, FaPlus, FaTimes, FaFilter } from 'react-icons/fa';
import { authAxios, MOCK_USERS, USE_MOCK_DATA } from '../services/auth.service';
import '../styles/Pages.css';

// Define search filter options
type SearchFilter = 'all' | 'name' | 'email' | 'role';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

interface MockUser extends Omit<User, 'role'> {
  password: string;
  role: 'admin' | 'staff' | 'viewer';
  permissions?: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'viewer';
  avatar?: string;
}

interface UserFormErrors {
  name?: string;
  email?: string;
  password?: string;
}

// Add User Modal Component
const AddUserModal: React.FC<{
  onClose: () => void;
  onUserAdded: (user: User) => void;
  onError: (error: string) => void;
}> = ({ onClose, onUserAdded, onError }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as const,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<UserFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    // Name validation
    if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
    } else if (formData.name.length > 30) {
      newErrors.name = 'Name must be less than 30 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Always use the real API endpoint
      const response = await authAxios.post('/users', {
        ...formData,
        role: formData.role || 'viewer'
      });
      
      if (response.data?.id) {
        const newUser: User = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          avatar: response.data.avatar,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        };
        onUserAdded(newUser);
        onClose();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      if (errorMessage.includes('Email already exists')) {
        setErrors({ ...errors, email: 'This email is already registered' });
      } else {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add User</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter user's full name"
              required
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
            <div className="field-hint">
              Name must be between 3 and 30 characters
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
            <div className="field-hint">
              Enter a valid email address that will be used for login
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
            <div className="field-hint">
              Password must be at least 6 characters long
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value;
                if (role === 'admin' || role === 'staff' || role === 'viewer') {
                  setFormData({ ...formData, role });
                }
              }}
              required
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <div className="field-hint">
              Select the appropriate role for this user
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .modal-header h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 4px;
          }

          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-field label {
            font-weight: 500;
            color: #1a1a1a;
          }

          .form-field input,
          .form-field select {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-field input:focus,
          .form-field select:focus {
            border-color: #3b82f6;
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }

          .field-hint {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }

          .field-error {
            font-size: 12px;
            color: #dc2626;
            margin-top: 4px;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
          }

          .cancel-button,
          .submit-button {
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cancel-button {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            color: #374151;
          }

          .cancel-button:hover {
            background: #e5e7eb;
          }

          .submit-button {
            background: #3b82f6;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .submit-button:hover {
            background: #2563eb;
          }

          .submit-button:disabled {
            background: #93c5fd;
            cursor: not-allowed;
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal: React.FC<{
  user: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
  onError: (error: string) => void;
}> = ({ user, onClose, onUserUpdated, onError }) => {
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<UserFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (formData.name) {
      if (formData.name.length < 3) {
        newErrors.name = 'Name must be at least 3 characters long';
      } else if (formData.name.length > 30) {
        newErrors.name = 'Name must be less than 30 characters';
      }
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Only include fields that have been changed
      const updateData: Partial<UserFormData> = {};
      
      if (formData.name !== user.name) updateData.name = formData.name;
      if (formData.email !== user.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;
      if (formData.role !== user.role) updateData.role = formData.role;
      
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      // Use the correct API endpoint without duplicate 'api' prefix
      const response = await authAxios.put(`/users/${user.id}`, updateData);
      
      // Handle the response based on the backend format
      if (response.data === true) {
        // If the update was successful, create the updated user object
        const updatedUser: User = {
          ...user,
          ...updateData,
          updated_at: new Date().toISOString()
        };
        onUserUpdated(updatedUser);
        onClose();
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update user';
      if (errorMessage.includes('Email already exists')) {
        setErrors({ ...errors, email: 'This email is already registered' });
      } else {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit User</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter user's full name"
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
            <div className="field-hint">
              Name must be between 3 and 30 characters
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
            <div className="field-hint">
              Enter a valid email address that will be used for login
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password">New Password (optional)</label>
            <input
              type="password"
              id="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password"
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
            <div className="field-hint">
              Leave blank to keep current password, or enter at least 6 characters
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={formData.role || ''}
              onChange={(e) => {
                const role = e.target.value;
                if (role === 'admin' || role === 'staff' || role === 'viewer') {
                  setFormData({ ...formData, role });
                }
              }}
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <div className="field-hint">
              Select the appropriate role for this user
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .modal-header h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 4px;
          }

          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-field label {
            font-weight: 500;
            color: #1a1a1a;
          }

          .form-field input,
          .form-field select {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-field input:focus,
          .form-field select:focus {
            border-color: #3b82f6;
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }

          .field-hint {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }

          .field-error {
            font-size: 12px;
            color: #dc2626;
            margin-top: 4px;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
          }

          .cancel-button,
          .submit-button {
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cancel-button {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            color: #374151;
          }

          .cancel-button:hover {
            background: #e5e7eb;
          }

          .submit-button {
            background: #3b82f6;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .submit-button:hover {
            background: #2563eb;
          }

          .submit-button:disabled {
            background: #93c5fd;
            cursor: not-allowed;
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [userCreationError, setUserCreationError] = useState<string | null>(null);
  const [userUpdateError, setUserUpdateError] = useState<string | null>(null);

  // Fetch users from the API or mock data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the correct API endpoint
      const response = await authAxios.get('/users');
      
      // Check if we have a valid response
      if (response.data) {
        // The response might be in different formats, handle them all
        let usersData = response.data;
        
        // If the response has a 'data' property, use that
        if (response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        }
        // If the response has a 'users' property, use that
        else if (response.data.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
        }
        // If the response is already an array, use it directly
        else if (!Array.isArray(usersData)) {
          console.error('Invalid response format:', response.data);
          setError('Invalid response format from server');
          return;
        }
        
        // Map the response data to our User interface
        const mappedUsers = usersData.map((user: any) => ({
          id: user.id || user.user_id,
          name: user.name || user.full_name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || user.profile_img,
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
        
        setUsers(mappedUsers);
      } else {
        console.error('Empty response from server');
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.response) {
        // Handle specific error cases
        if (err.response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view users.');
        } else {
          setError(err.response.data?.message || 'Failed to fetch users. Please try again later.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (searchFilter === 'all' || searchFilter === 'name') && user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (searchFilter === 'all' || searchFilter === 'email') && user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (searchFilter === 'all' || searchFilter === 'role') && user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilter('all');
    setShowFilters(false);
  };

  // Handle filter change
  const handleFilterChange = (filter: SearchFilter) => {
    setSearchFilter(filter);
  };

  // Toggle filters display
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get the first letter of the user's name for avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Get a background color based on the initial
  const getAvatarColor = (initial: string) => {
    const colors = [
      '#6366F1', // Indigo
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#F43F5E', // Rose
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#8B5CF6', // Violet
    ];
    
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle adding a new user
  const handleAddUser = () => {
    setUserCreationError(null);
    setShowAddModal(true);
  };

  // Handle when a user is successfully added
  const handleUserAdded = (newUser: User) => {
    setUserCreationError(null);
    setUsers(prevUsers => [newUser, ...prevUsers]);
  };

  // Handle user creation error
  const handleCreationError = (errorMessage: string) => {
    setUserCreationError(errorMessage);
    setTimeout(() => {
      setUserCreationError(null);
    }, 5000);
  };

  // Get placeholder text based on current filter
  const getPlaceholderText = () => {
    switch (searchFilter) {
      case 'name': return 'Search by Name';
      case 'email': return 'Search by Email';
      case 'role': return 'Search by Role';
      default: return 'Search users by name, email, or role';
    }
  };

  // Handle editing a user
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle user update
  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
  };

  // Loading state
  if (loading) {
    return (
      <PageTemplate 
        title="Users" 
        subtitle="Loading user data..."
        accessLevel={['admin']}
      >
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading users data...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate 
      title="Users" 
      subtitle="Manage system users and their permissions"
      accessLevel={['admin']}
    >
      <div>
        {error && !loading && (
          <div className="notification warning">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        {userCreationError && (
          <div className="notification warning">
            <FaExclamationTriangle /> {userCreationError}
          </div>
        )}
        
        {userUpdateError && (
          <div className="notification warning">
            <FaExclamationTriangle /> {userUpdateError}
          </div>
        )}
        
        <div className="page-actions-container">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={getPlaceholderText()}
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            
            <button 
              className="filter-button"
              onClick={toggleFilters}
              title="Search filters"
            >
              <FaFilter className={`filter-icon ${searchFilter !== 'all' ? 'filter-active' : ''}`} />
            </button>
            
            {searchTerm && (
              <button 
                className="clear-search-button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
            
            {showFilters && (
              <div className="search-filters">
                <div className="filter-option">
                  <input 
                    type="radio" 
                    id="filter-all" 
                    name="search-filter" 
                    checked={searchFilter === 'all'} 
                    onChange={() => handleFilterChange('all')} 
                  />
                  <label htmlFor="filter-all">All Fields</label>
                </div>
                
                <div className="filter-option">
                  <input 
                    type="radio" 
                    id="filter-name" 
                    name="search-filter" 
                    checked={searchFilter === 'name'} 
                    onChange={() => handleFilterChange('name')} 
                  />
                  <label htmlFor="filter-name">Name</label>
                </div>
                
                <div className="filter-option">
                  <input 
                    type="radio" 
                    id="filter-email" 
                    name="search-filter" 
                    checked={searchFilter === 'email'} 
                    onChange={() => handleFilterChange('email')} 
                  />
                  <label htmlFor="filter-email">Email</label>
                </div>
                
                <div className="filter-option">
                  <input 
                    type="radio" 
                    id="filter-role" 
                    name="search-filter" 
                    checked={searchFilter === 'role'} 
                    onChange={() => handleFilterChange('role')} 
                  />
                  <label htmlFor="filter-role">Role</label>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="add-button" 
            onClick={handleAddUser}
          >
            <FaPlus className="add-icon" />
            Add User
          </button>
        </div>

        {users.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const initial = getInitial(user.name);
                const avatarColor = getAvatarColor(initial);
                
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div 
                          className="user-avatar"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initial}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                      >
                        <FaPencilAlt />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}
        
        {users.length > 0 && filteredUsers.length === 0 && (
          <div className="no-results">
            <p>No users found matching your search criteria.</p>
            {searchTerm && (
              <button className="action-button" onClick={clearSearch}>
                Clear Search
              </button>
            )}
          </div>
        )}

        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onUserAdded={handleUserAdded}
            onError={handleCreationError}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onUserUpdated={handleUserUpdated}
            onError={(error) => {
              setUserUpdateError(error);
              setTimeout(() => setUserUpdateError(null), 5000);
            }}
          />
        )}
      </div>
    </PageTemplate>
  );
};

export default Users; 