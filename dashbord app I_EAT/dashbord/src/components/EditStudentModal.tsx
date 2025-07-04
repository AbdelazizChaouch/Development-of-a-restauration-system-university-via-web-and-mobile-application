import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { Student, StudentApi } from '../services/api.service';
import '../styles/Modal.css';

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onStudentUpdated: (student: Student) => void;
  onError?: (message: string) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ 
  student, 
  onClose, 
  onStudentUpdated,
  onError
}) => {
  // Form state
  const [formData, setFormData] = useState({
    cn: student.cn || '',
    name: student.name || '',
    profileImage: student.profileImage || '',
    university_id: student.university_id?.toString() || ''
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    cn: '',
    name: '',
    university_id: ''
  });
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form data
  const validateForm = (): boolean => {
    const newErrors = {
      cn: '',
      name: '',
      university_id: ''
    };
    
    let isValid = true;
    
    // CN validation (must be exactly 8 digits if provided)
    if (formData.cn && !/^\d{8}$/.test(formData.cn)) {
      newErrors.cn = 'CN must be exactly 8 digits';
      isValid = false;
    }
    
    // Name validation (required)
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }
    
    // University ID validation (must be between 1-10 digits if provided)
    if (formData.university_id && !/^\d{1,10}$/.test(formData.university_id)) {
      newErrors.university_id = 'University ID must be between 1-10 digits';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setSubmitError('');
    setSubmitSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const updateData: Partial<Student> = {
        name: formData.name,
        cn: formData.cn || undefined,
        profileImage: formData.profileImage || undefined,
        university_id: formData.university_id ? parseInt(formData.university_id) : undefined
      };
      
      // Call API to update student
      const updatedStudent = await StudentApi.update(student.id, updateData);
      
      // Show success message
      setSubmitSuccess(true);
      
      // Notify parent component
      onStudentUpdated(updatedStudent);
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating student:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update student. Please try again.';
      
      setSubmitError(errorMessage);
      
      // Notify parent component of error if callback provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Student</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {submitSuccess && (
            <div className="notification success">
              <FaCheck /> Student updated successfully!
            </div>
          )}
          
          {submitError && (
            <div className="notification error">
              <FaExclamationTriangle /> {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="student-id">Student ID</label>
              <input
                type="text"
                id="student-id"
                value={student.id}
                disabled
                className="form-control read-only"
              />
              <small>Student ID cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="cn">CN (8 digits)</label>
              <input
                type="text"
                id="cn"
                name="cn"
                value={formData.cn}
                onChange={handleChange}
                className={`form-control ${errors.cn ? 'error' : ''}`}
                placeholder="Enter 8-digit CN"
              />
              {errors.cn && <div className="error-message">{errors.cn}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-control ${errors.name ? 'error' : ''}`}
                placeholder="Enter full name"
                required
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="profileImage">Profile Image URL</label>
              <input
                type="text"
                id="profileImage"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter profile image URL (optional)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="university_id">University ID</label>
              <input
                type="text"
                id="university_id"
                name="university_id"
                value={formData.university_id}
                onChange={handleChange}
                className={`form-control ${errors.university_id ? 'error' : ''}`}
                placeholder="Enter university ID (optional)"
              />
              {errors.university_id && <div className="error-message">{errors.university_id}</div>}
            </div>
            
            <div className="form-actions">
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
                {isSubmitting ? 'Updating...' : 'Update Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal; 