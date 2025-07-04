import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAxios } from '../services/api.service';

interface Student {
  student_id: string;
  full_name: string;
  email: string;
}

export function CreateReclamation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [evidence, setEvidence] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fetchingStudents, setFetchingStudents] = useState<boolean>(true);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setFetchingStudents(true);
        const response = await authAxios.get('/students');
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again later.');
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for the reclamation');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAxios.post('/reclamations', {
        student_id: selectedStudent,
        amount: parseFloat(amount),
        reason,
        evidence: evidence.trim() || null
      });
      
      console.log('Reclamation created:', response.data);
      setSuccess(true);
      
      // Reset form
      setSelectedStudent('');
      setAmount('');
      setReason('');
      setEvidence('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/reclamations');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating reclamation:', error);
      setError(error.response?.data?.message || 'Failed to create reclamation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'staff') {
    return (
      <div className="unauthorized-container">
        <h1>Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="reclamation-container">
      <style>{`
        .reclamation-container {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #1e293b;
        }
        
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }
        
        .form-control:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        select.form-control {
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 10px center;
          background-repeat: no-repeat;
          background-size: 20px 20px;
          padding-right: 40px;
          appearance: none;
        }
        
        textarea.form-control {
          min-height: 120px;
          resize: vertical;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: none;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
        }
        
        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #ef4444;
          margin-top: 8px;
          font-size: 14px;
        }
        
        .success-message {
          background-color: #10b981;
          color: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
        }
        
        .success-message svg {
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 16px;
          text-decoration: none;
          cursor: pointer;
        }
        
        .back-button svg {
          margin-right: 8px;
        }
        
        .back-button:hover {
          color: #1e293b;
        }
        
        .loading-spinner {
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div onClick={() => navigate('/reclamations')} className="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Reclamations
      </div>
      
      <div className="card">
        <div className="header">
          <h1>Submit Reclamation</h1>
        </div>
        
        {success && (
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Reclamation submitted successfully! Redirecting...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="student">Student</label>
            <select
              id="student"
              className="form-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={loading || fetchingStudents}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </select>
            {fetchingStudents && <div className="loading-text">Loading students...</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount to Deduct (DT)</label>
            <input
              type="number"
              id="amount"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why funds should be deducted"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="evidence">Evidence (Optional)</label>
            <textarea
              id="evidence"
              className="form-control"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Provide any evidence or additional details"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading-spinner"></span>}
            {loading ? 'Submitting...' : 'Submit Reclamation'}
          </button>
        </form>
      </div>
    </div>
  );
} 