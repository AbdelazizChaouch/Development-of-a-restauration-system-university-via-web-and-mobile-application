import React, { useState } from 'react';
import { StudentApi, Student } from '../services/api.service';
import '../styles/AddStudentModal.css';

interface AddStudentModalProps {
  onClose: () => void;
  onStudentAdded: (student: Student) => void;
  onError?: (errorMessage: string) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onStudentAdded, onError }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    cn: '',
    profileImage: '',
    university_id: '',
  });
  
  const [formErrors, setFormErrors] = useState<{
    student_id?: string;
    name?: string;
    cn?: string;
    university_id?: string;
    general?: string;
  }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCheckingId, setIsCheckingId] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error when any field is edited
    if (error) {
      setError(null);
    }

    // If the student_id field is being changed and it has 5 digits, 
    // check if it already exists after a short delay
    if (name === 'student_id' && /^\d{5}$/.test(value)) {
      setIsCheckingId(true);
      
      // Use a debounce technique to avoid too many API calls
      const timer = setTimeout(async () => {
        try {
          // Make a simple GET request to see if the student exists
          const response = await fetch(`http://localhost:5000/api/students/${value}`);
          
          // If we get a 200 OK, the student exists
          if (response.ok) {
            setFormErrors(prev => ({
              ...prev,
              student_id: 'A student with this ID already exists'
            }));
          }
        } catch (error) {
          console.error('Error checking student ID:', error);
        } finally {
          setIsCheckingId(false);
        }
      }, 500); // Wait 500ms after typing stops
      
      // Clean up the timer if the component unmounts or the user types again
      return () => clearTimeout(timer);
    }
  };
  
  // Check if a student ID already exists
  const checkStudentIdExists = async (studentId: string): Promise<boolean> => {
    try {
      // Call our API to check if this ID exists
      // This is a hypothetical endpoint - you would need to implement it on the backend
      // Alternatively, you could try to fetch the student by ID and check if it exists
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/exists`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      
      // If the request fails, we'll assume the ID doesn't exist to prevent blocking the user
      return false;
    } catch (error) {
      console.error('Error checking if student ID exists:', error);
      return false;
    }
  };

  // Validate the form before submission
  const validateForm = (): boolean => {
    const errors: {
      student_id?: string;
      name?: string;
      cn?: string;
      university_id?: string;
    } = {};
    
    // Validate Student ID - must be exactly 5 digits
    if (!formData.student_id) {
      errors.student_id = 'Student ID is required';
    } else if (!/^\d{5}$/.test(formData.student_id)) {
      errors.student_id = 'Student ID must be exactly 5 digits';
    }
    
    // Validate CN - must be exactly 8 digits
    if (formData.cn && !/^\d{8}$/.test(formData.cn)) {
      errors.cn = 'CN must be exactly 8 digits';
    }
    
    // Validate Name
    if (!formData.name) {
      errors.name = 'Full name is required';
    }
    
    // Validate University ID - must be between 1 and 10 digits
    if (!formData.university_id) {
      errors.university_id = 'University ID is required';
    } else if (!/^\d{1,10}$/.test(formData.university_id)) {
      errors.university_id = 'University ID must be between 1 and 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Block submission if we already know the student ID exists
    if (formErrors.student_id && formErrors.student_id.includes('already exists')) {
      setError('Cannot create student: A student with this ID already exists');
      // Notify parent component about the error
      if (onError) {
        onError('A student with this ID already exists');
      }
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Convert string IDs to numbers
      const studentId = parseInt(formData.student_id);
      const universityId = formData.university_id ? parseInt(formData.university_id) : undefined;
      
      // Get current user information for tracking
      const currentUser = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}') : 
        null;
      
      // Double-check if student already exists before submission
      try {
        const response = await fetch(`http://localhost:5000/api/students/${studentId}`);
        if (response.ok) {
          // Student exists, show error and stop
          setIsSubmitting(false);
          setFormErrors(prev => ({
            ...prev,
            student_id: 'A student with this ID already exists'
          }));
          setError('Student creation failed: A student with this ID already exists');
          
          // Notify parent component about the error
          if (onError) {
            onError('A student with this ID already exists');
          }
          return;
        }
      } catch (checkError) {
        // Continue if check fails - the create call will handle duplicates properly
        console.error('Error checking if student exists:', checkError);
      }
      
      // Prepare the student data
      // Card ID will be auto-generated in the API
      const studentData = {
        id: studentId,
        name: formData.name,
        cn: formData.cn || undefined,
        profileImage: formData.profileImage || undefined,
        university_id: universityId,
        // Include user information for tracking
        created_by: currentUser?.id || undefined,
      };
      
      console.log('Submitting student data:', studentData);
      
      // First check if a student with this ID already exists
      try {
        // Create the student
        const newStudent = await StudentApi.create(studentData);
        
        // Only show success message if we get here (no errors)
        let successMsg = `Student created successfully! Card Number: ${newStudent.card_id}`;
        if (newStudent.qrCode) {
          successMsg += '. QR code has been generated.';
        }
        
        setSuccessMessage(successMsg);
        
        // Notify parent component
        onStudentAdded(newStudent);
        
        // Close the modal after a short delay to show the success message
        setTimeout(() => {
          onClose();
        }, 2500); // Increased delay to allow user to see the card number
      } catch (createError) {
        // Handle the error from the create method
        const errorMessage = createError instanceof Error ? createError.message : 'Failed to create student. Please try again.';
        
        console.log('Error creating student:', errorMessage);
        
        // Handle different types of errors
        if (errorMessage.includes('already exists')) {
          // Show the duplicate student ID error prominently
          setFormErrors(prev => ({
            ...prev,
            student_id: 'A student with this ID already exists'
          }));
          
          // Also display a general error to make it more visible
          setError('Student creation failed: A student with this ID already exists');
          
          // Notify parent component about the error
          if (onError) {
            onError('A student with this ID already exists');
          }
        } else if (errorMessage.includes('Student ID')) {
          setFormErrors(prev => ({
            ...prev,
            student_id: errorMessage
          }));
          
          // Notify parent component about the error
          if (onError) {
            onError(`Student ID error: ${errorMessage}`);
          }
        } else if (errorMessage.includes('CN')) {
          setFormErrors(prev => ({
            ...prev,
            cn: errorMessage
          }));
          
          // Notify parent component about the error
          if (onError) {
            onError(`CN error: ${errorMessage}`);
          }
        } else if (errorMessage.includes('Database error')) {
          // Special handling for database column errors
          setError('There is a mismatch between the form and the database schema. Please contact support.');
          console.error('Database schema mismatch:', errorMessage);
          
          // Notify parent component about the error
          if (onError) {
            onError('Database error: Please contact support');
          }
        } else {
          setError(errorMessage);
          
          // Notify parent component about the error
          if (onError) {
            onError(errorMessage);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error in form submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      
      // Notify parent component about the error
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-student-backdrop" onClick={onClose}>
      <div className="add-student-container" onClick={e => e.stopPropagation()}>
        <h2 className="add-student-title">Add Student</h2>
        
        {error && (
          <div className="add-student-error">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}
        
        {successMessage && (
          <div className="add-student-success">
            <span className="success-icon">✅</span> {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="add-student-form">
          <div className="form-group">
            <label htmlFor="student_id">Student ID *</label>
            <div className="input-with-status">
              <input
                type="text"
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="Enter 5-digit student ID"
                required
                maxLength={5}
                pattern="\d{5}"
                className={formErrors.student_id ? 'error-input' : ''}
                disabled={isSubmitting}
              />
              {isCheckingId && (
                <span className="checking-status">Checking...</span>
              )}
            </div>
            {formErrors.student_id && (
              <span className="field-error">{formErrors.student_id}</span>
            )}
          </div>
        
          <div className="form-group">
            <label htmlFor="cn">CN *</label>
            <input
              type="text"
              id="cn"
              name="cn"
              value={formData.cn}
              onChange={handleChange}
              placeholder="Enter exactly 8 digits"
              maxLength={8}
              pattern="\d{8}"
              className={formErrors.cn ? 'error-input' : ''}
              disabled={isSubmitting}
            />
            {formErrors.cn && (
              <span className="field-error">{formErrors.cn}</span>
            )}
            <span className="field-help">Enter exactly 8 digits</span>
          </div>
        
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student's full name"
              required
              className={formErrors.name ? 'error-input' : ''}
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="profileImage">Profile Image URL</label>
            <input
              type="text"
              id="profileImage"
              name="profileImage"
              value={formData.profileImage}
              onChange={handleChange}
              placeholder="Enter image URL"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="upload-button"
              onClick={() => alert("Upload functionality would go here")}
              disabled={isSubmitting}
            >
              Upload
            </button>
          </div>
          
          <div className="form-group">
            <label htmlFor="university_id">University ID *</label>
            <input
              type="text"
              id="university_id"
              name="university_id"
              value={formData.university_id}
              onChange={handleChange}
              placeholder="Enter university ID"
              required
              className={formErrors.university_id ? 'error-input' : ''}
              disabled={isSubmitting}
            />
            {formErrors.university_id && (
              <span className="field-error">{formErrors.university_id}</span>
            )}
            <span className="field-help">Enter a number between 1 and 10 digits</span>
          </div>
          
          <div className="form-note">
            <p>Note: A unique card number will be automatically generated for this student.</p>
          </div>
          
          <div className="add-student-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal; 