import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fetchFromApi } from '../services/api.service';
import { FaSearch, FaFilter, FaCalendarAlt, FaUser, FaCreditCard, FaDownload, FaUndo, FaSpinner, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/Pages.css';
import PageTemplate from '../components/PageTemplate';

interface User {
  id: string;
  name: string;
  role: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  card_number?: string;
  student_id?: string;
  full_name?: string;
  details: any;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

const CardActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter states
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Pagination
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  
  // Available users for filtering
  const [availableUsers, setAvailableUsers] = useState<{id: string, name: string}[]>([]);
  
  // Load user from localStorage on component mount
  useEffect(() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);
  
  // Extract unique users from logs for the user filter dropdown
  const extractUniqueUsers = (logs: ActivityLog[]): {id: string, name: string}[] => {
    return logs
      .filter(log => log.user_name && log.user_id)
      .map(log => ({ id: log.user_id, name: log.user_name || 'Unknown' }))
      .reduce((acc: {id: string, name: string}[], user: {id: string, name: string}) => {
        // Only add unique users
        if (!acc.some(u => u.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, []);
  };
  
  // Fetch logs with current filters
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (action) queryParams.append('action', action);
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      
      const queryString = queryParams.toString();
      console.log('Fetching logs with query string:', queryString);
      
      // Get user authentication from localStorage
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      if (!userData || !userData.id) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Prepare headers with authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-ID': userData.id.toString(),
        'X-User-Role': userData.role || 'staff'
      };
      
      // Add authorization token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Fetching logs with headers:', headers);
      
      // Make the API request
      const response = await fetch(`http://localhost:5000/api/university-card-logs?${queryString}`, {
        method: 'GET',
        headers
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error('Error response:', errorText);
        throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Logs response:', data);
      
      if (data.success && Array.isArray(data.data)) {
        // Process the logs to ensure details are properly formatted
        const processedLogs = data.data.map((log: ActivityLog) => {
          // Ensure details is an object
          if (log.details && typeof log.details === 'string') {
            try {
              log.details = JSON.parse(log.details);
            } catch (e) {
              console.error('Error parsing log details:', e, log.details);
              // Keep as string if parsing fails
            }
          }
          return log;
        });
        
        console.log('Processed logs:', processedLogs);
        
        // Filter by user name if specified
        let filteredLogs = processedLogs;
        if (userName) {
          const lowerUserName = userName.toLowerCase();
          filteredLogs = processedLogs.filter((log: ActivityLog) => 
            log.user_name && log.user_name.toLowerCase().includes(lowerUserName)
          );
        }
        
        setLogs(filteredLogs);
        setAvailableUsers(extractUniqueUsers(processedLogs));
      } else {
        setLogs([]);
        console.warn('No logs found or invalid response format', data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch logs on component mount and when filters change
  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, limit, offset]);
  
  // Handle filter form submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    offset === 0 ? fetchLogs() : setOffset(0); // Reset to first page if not already there
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setUserId('');
    setUserName('');
    setStartDate('');
    setEndDate('');
    setAction('');
    setOffset(0);
  };
  
  // Format the action for display
  const formatAction = (action: string): string => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format the date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };
  
  // Format the details for display
  const formatDetails = (details: any): string => {
    console.log('Formatting details:', details, typeof details);
    
    if (!details) return 'No details';
    
    try {
      // If details is a string, try to parse it as JSON
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
          console.log('Parsed details from string:', details);
        } catch (parseError) {
          console.error('Error parsing details JSON string:', parseError);
          return details; // Return the original string if parsing fails
        }
      }
      
      // Handle different action types
      if (details.amount && details.operation) {
        const operation = details.operation === 'add' ? 'Added' : 'Subtracted';
        return `${operation} ${parseFloat(details.amount).toFixed(2)} DT. Previous balance: ${parseFloat(details.previous_balance).toFixed(2)} DT, New balance: ${parseFloat(details.new_balance).toFixed(2)} DT`;
      }
      
      if (details.updated_fields) {
        return `Updated fields: ${details.updated_fields.join(', ')}`;
      }
      
      if (details.student_id) {
        return `Student ID: ${details.student_id}, Card Number: ${details.card_number || 'N/A'}`;
      }
      
      // Default formatting - pretty print the JSON
      return JSON.stringify(details, null, 2);
    } catch (error) {
      console.error('Error formatting details:', error, details);
      
      // Fallback to simple string representation
      if (typeof details === 'object') {
        try {
          return JSON.stringify(details);
        } catch (stringifyError) {
          console.error('Error stringifying details:', stringifyError);
          return 'Error displaying details';
        }
      }
      
      return String(details);
    }
  };
  
  // Test authentication
  const testAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing authentication...');
      
      const response = await fetchFromApi<AuthResponse>('/auth/test', {
        method: 'GET'
      });
      
      console.log('Auth test response:', response);
      
      if (response.success) {
        setSuccess('Authentication successful: ' + response.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Authentication failed: ' + response.message);
      }
    } catch (error) {
      console.error('Error testing authentication:', error);
      setError(error instanceof Error ? error.message : 'Failed to test authentication');
    } finally {
      setLoading(false);
    }
  };

  // Toggle filters display
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Clear filters
  const clearFilters = () => {
    setUserName('');
    handleResetFilters();
  };

  // Loading state
  if (loading && !user) {
    return (
      <PageTemplate 
        title="Card Activity Logs" 
        subtitle="Loading activity data..."
        accessLevel={['admin', 'staff', 'viewer']}
      >
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading activity logs data...</p>
        </div>
      </PageTemplate>
    );
  }
  
  return (
    <PageTemplate 
      title="Card Activity Logs" 
      subtitle={user ? "" : "Please log in to view activity logs"}
      accessLevel={['admin', 'staff', 'viewer']}
    >
      <div>
        {error && (
          <div className="notification warning">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        {success && (
          <div className="notification success">
            {success}
          </div>
        )}
      
        {/* Search and Filters */}
        <div className="page-actions-container">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by user name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="search-input"
            />
            
            <button 
              className="filter-button"
              onClick={toggleFilters}
              title="Search filters"
            >
              <FaFilter className={`filter-icon ${showFilters ? 'filter-active' : ''}`} />
            </button>
            
            {userName && (
              <button 
                className="clear-search-button"
                onClick={clearFilters}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
            
            {showFilters && (
              <div className="search-filters logs-filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Start Date:</label>
                    <div className="date-input-container">
                      <FaCalendarAlt className="date-icon" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                        className="date-input"
              />
                    </div>
            </div>
            
                  <div className="filter-group">
                    <label>End Date:</label>
                    <div className="date-input-container">
                      <FaCalendarAlt className="date-icon" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                  </div>
            </div>
            
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Action:</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                      className="filter-select"
              >
                <option value="">All Actions</option>
                <option value="add_funds">Add Funds</option>
                <option value="subtract_funds">Subtract Funds</option>
                <option value="create_card">Create Card</option>
                <option value="update_card">Update Card</option>
                <option value="delete_card">Delete Card</option>
              </select>
            </div>
            
                  <div className="filter-group">
                    <label>Results Per Page:</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                      className="filter-select"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
          </div>
        </div>
          
                <div className="filter-actions">
            <button
              onClick={handleFilterSubmit}
                    className="filter-apply-button"
            >
              <FaFilter /> Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
                    className="filter-reset-button"
            >
              <FaUndo /> Reset
            </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            className="debug-button"
            onClick={() => {
              const doc = new jsPDF();
              
              // Add title
              doc.setFontSize(16);
              doc.text('Card Activity Logs Report', 14, 15);
              
              // Add date
              doc.setFontSize(10);
              doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
              
              // Prepare table data
              const tableData = logs.map(log => [
                formatDate(log.created_at),
                log.user_name || log.user_id || 'N/A',
                formatAction(log.action),
                log.full_name || (log.student_id ? `ID: ${log.student_id}` : 'N/A'),
                log.card_number || 'N/A',
                formatDetails(log.details)
              ]);
              
              // Add table
              autoTable(doc, {
                head: [['Date', 'User', 'Action', 'Student', 'Card Number', 'Details']],
                body: tableData,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                  0: { cellWidth: 30 },
                  1: { cellWidth: 25 },
                  2: { cellWidth: 25 },
                  3: { cellWidth: 25 },
                  4: { cellWidth: 25 },
                  5: { cellWidth: 60 }
                }
              });
              
              // Save the PDF
              doc.save('card-activity-logs.pdf');
              setSuccess('PDF report generated successfully');
              setTimeout(() => setSuccess(null), 3000);
            }}
          >
            <FaDownload /> Generate PDF Report
          </button>
        </div>
      
      {/* Logs Table */}
      {loading ? (
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p>Loading activity logs data...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <FaCreditCard className="empty-state-icon" />
            <p>No activity logs found</p>
            <button className="action-button" onClick={fetchLogs}>
              Refresh
            </button>
        </div>
      ) : (
        <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Student</th>
                  <th>Card Number</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  // Pre-format details for display
                  let detailsDisplay = 'No details available';
                  if (log.details) {
                    try {
                      const details = typeof log.details === 'string' 
                        ? JSON.parse(log.details) 
                        : log.details;
                      detailsDisplay = formatDetails(details);
                    } catch (e) {
                      console.error('Error formatting details for display:', e);
                      detailsDisplay = typeof log.details === 'string' 
                        ? log.details 
                        : 'Error formatting details';
                    }
                  }
                  
                  return (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {(log.user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{log.user_name || log.user_id || 'N/A'}</div>
                            {log.user_role && <div className="user-role">{log.user_role}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge ${log.action.includes('add') ? 'action-add' : 
                                           log.action.includes('subtract') ? 'action-subtract' : 
                                           log.action.includes('create') ? 'action-create' :
                                           log.action.includes('update') ? 'action-update' : 'action-other'}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="student-cell">
                        {log.full_name || (log.student_id ? `ID: ${log.student_id}` : 'N/A')}
                      </td>
                      <td className="card-number-cell">
                        {log.card_number || 'N/A'}
                      </td>
                      <td className="details-cell">
                        <div className="details-content">
                          {detailsDisplay}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          
          {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing <span>{offset + 1}</span> to{' '}
                <span>{Math.min(offset + logs.length, offset + limit)}</span> results
              </div>
              
              <div className="pagination-controls">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className={`pagination-button ${offset === 0 ? 'pagination-disabled' : ''}`}
                >
                  Previous
                </button>
                
                <button
                  disabled={logs.length < limit}
                  onClick={() => setOffset(offset + limit)}
                  className={`pagination-button ${logs.length < limit ? 'pagination-disabled' : ''}`}
                >
                  Next
                </button>
              </div>
            </div>
        </>
      )}
    </div>

      <style>
        {`
        .notification.success {
          background-color: #d1fae5;
          border: 1px solid #34d399;
          color: #065f46;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }
        
        .logs-filters {
          width: 400px;
          padding: 16px;
        }
        
        .filter-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }
        
        .filter-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: #4B5563;
        }
        
        .date-input-container {
          position: relative;
        }
        
        .date-icon {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #6B7280;
          pointer-events: none;
        }
        
        .date-input {
          width: 100%;
          padding: 8px 8px 8px 30px;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
          font-size: 14px;
        }
        
        .filter-select {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
          font-size: 14px;
        }
        
        .filter-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .filter-apply-button {
          padding: 8px 12px;
          background-color: #4F46E5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .filter-reset-button {
          padding: 8px 12px;
          background-color: #E5E7EB;
          color: #4B5563;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .debug-button {
          padding: 8px 12px;
          background-color: #10B981;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #E5E7EB;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-weight: 500;
        }
        
        .user-role {
          font-size: 12px;
          color: #6B7280;
        }
        
        .action-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .action-add {
          background-color: #D1FAE5;
          color: #065F46;
        }
        
        .action-subtract {
          background-color: #FEE2E2;
          color: #B91C1C;
        }
        
        .action-create {
          background-color: #DBEAFE;
          color: #1E40AF;
        }
        
        .action-update {
          background-color: #FEF3C7;
          color: #92400E;
        }
        
        .action-other {
          background-color: #E5E7EB;
          color: #111827;
        }
        
        .student-cell {
          font-weight: 500;
        }
        
        .card-number-cell {
          font-family: monospace;
        }
        
        .details-cell {
          position: relative;
        }
        
        .details-content {
          max-height: 80px;
          overflow: auto;
          font-size: 14px;
          white-space: pre-wrap;
        }
        
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          background-color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .pagination-info {
          font-size: 14px;
          color: #6B7280;
        }
        
        .pagination-info span {
          font-weight: 600;
        }
        
        .pagination-controls {
          display: flex;
          gap: 8px;
        }
        
        .pagination-button {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          background-color: white;
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .pagination-disabled {
          background-color: #F3F4F6;
          color: #9CA3AF;
          cursor: not-allowed;
        }
        
        .empty-state-icon {
          font-size: 32px;
          color: #9CA3AF;
          margin-bottom: 16px;
        }
        
        .empty-state p {
          margin-bottom: 16px;
        }
        `}
      </style>
    </PageTemplate>
  );
};

export default CardActivityLogs; 