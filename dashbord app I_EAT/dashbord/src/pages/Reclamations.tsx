import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchFromApi } from '../services/api.service';
import { FaFilter, FaSearch, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import '../styles/Pages.css';

interface Reclamation {
  id: string;
  staff_id: string;
  staff_name: string;
  student_id: string;
  amount: number;
  reason: string;
  evidence: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'error';
  admin_id: string | null;
  admin_name: string | null;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReclamationCounts {
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
  error?: number;
}

export function Reclamations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [processingReclamation, setProcessingReclamation] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [studentIdFilter, setStudentIdFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  const [counts, setCounts] = useState<ReclamationCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    processed: 0
  });
  const [showProcessModal, setShowProcessModal] = useState<boolean>(false);

  // Apply filters to the API request
  const buildFilterQuery = () => {
    const filters = [];
    
    if (statusFilter !== 'all') {
      filters.push(`status=${statusFilter}`);
    }
    
    if (studentIdFilter) {
      filters.push(`studentId=${studentIdFilter}`);
    }
    
    if (minAmount) {
      filters.push(`minAmount=${minAmount}`);
    }
    
    if (maxAmount) {
      filters.push(`maxAmount=${maxAmount}`);
    }
    
    if (dateFilter === 'custom') {
      // Allow filtering with just startDate if endDate is not provided
      if (startDate) {
        filters.push(`startDate=${startDate}`);
        if (endDate) {
          filters.push(`endDate=${endDate}`);
        }
      }
    } else if (dateFilter === '7days') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      filters.push(`startDate=${date.toISOString().split('T')[0]}`);
    } else if (dateFilter === '30days') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      filters.push(`startDate=${date.toISOString().split('T')[0]}`);
    } else if (dateFilter === '90days') {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      filters.push(`startDate=${date.toISOString().split('T')[0]}`);
    }
    
    return filters.length > 0 ? `?${filters.join('&')}` : '';
  };

  // Fetch reclamations with filters
  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        setLoading(true);
        const queryString = buildFilterQuery();
        const response = await fetchFromApi<{success: boolean, data: Reclamation[]}>(`/reclamations${queryString}`, {
          method: 'GET',
          headers: {
            'X-No-Log': 'true'  // This header tells the server not to log this view action
          }
        });
        
        if (response.success && response.data) {
          setReclamations(response.data);
        } else {
          setError('Failed to load reclamations');
        }
      } catch (error) {
        console.error('Error fetching reclamations:', error);
        setError('Failed to load reclamations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, [statusFilter, dateFilter, minAmount, maxAmount, studentIdFilter, startDate, endDate]);

  // Fetch counts (admin only)
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchCounts = async () => {
        try {
          const response = await fetchFromApi<{success: boolean, data: ReclamationCounts}>('/reclamations/counts', {
            method: 'GET',
            headers: {
              'X-No-Log': 'true'
            }
          });
          
          if (response.success && response.data) {
            setCounts(response.data);
          }
        } catch (error) {
          console.error('Error fetching reclamation counts:', error);
        }
      };

      fetchCounts();
    }
  }, [user]);

  const handleCreateReclamation = () => {
    navigate('/create-reclamation');
  };

  const handleViewDetails = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setAdminNotes(reclamation.admin_notes || '');
  };

  const handleCloseDetails = () => {
    setSelectedReclamation(null);
    setAdminNotes('');
  };

  const handleProcessReclamation = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setAdminNotes('');
    setShowProcessModal(true);
  };

  const handleSubmitProcess = async (status: 'approved' | 'rejected') => {
    if (!selectedReclamation) return;

    setProcessingReclamation(true);
    
    try {
      const response = await fetchFromApi<{success: boolean, message: string}>(`/reclamations/${selectedReclamation.id}/process`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          admin_notes: adminNotes.trim() || null
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success) {
        // Update local state
        setReclamations(prev => 
          prev.map(r => 
            r.id === selectedReclamation.id 
              ? { ...r, status, admin_notes: adminNotes, admin_id: user?.id || null, admin_name: user?.name || null }
              : r
          )
        );
        
        // Update counts
        if (user?.role === 'admin') {
          setCounts(prev => ({
            ...prev,
            pending: prev.pending - 1,
            [status]: prev[status] + 1
          }));
        }
        
        setShowProcessModal(false);
        setSelectedReclamation(null);
      } else {
        setError(response.message || 'Failed to process reclamation');
      }
    } catch (error: any) {
      console.error('Error processing reclamation:', error);
      setError(error.response?.data?.message || 'Failed to process reclamation. Please try again.');
    } finally {
      setProcessingReclamation(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'processed':
        return 'badge-info';
      case 'error':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <div className="unauthorized-container">
        <h1>Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="reclamations-container">
      <style>{`
        .reclamations-container {
          padding: 24px;
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
        
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .stat-card p {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .stat-card.pending h3 {
          color: #f59e0b;
        }
        
        .stat-card.pending p {
          color: #d97706;
        }
        
        .stat-card.approved h3 {
          color: #10b981;
        }
        
        .stat-card.approved p {
          color: #059669;
        }
        
        .stat-card.rejected h3 {
          color: #ef4444;
        }
        
        .stat-card.rejected p {
          color: #dc2626;
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
          font-size: 14px;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: none;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
        }
        
        .filters {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }
        
        .filter-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
        }
        
        .filter-select {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background-color: white;
          font-size: 14px;
        }
        
        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
        }
        
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
          color: #1e293b;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .badge-warning {
          background-color: #fef3c7;
          color: #d97706;
        }
        
        .badge-success {
          background-color: #d1fae5;
          color: #059669;
        }
        
        .badge-danger {
          background-color: #fee2e2;
          color: #dc2626;
        }
        
        .badge-info {
          background-color: #e0f2fe;
          color: #0284c7;
        }
        
        .badge-error {
          background-color: #fecdd3;
          color: #be123c;
        }
        
        .action-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #3b82f6;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .action-button:hover {
          background-color: #f1f5f9;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
        
        .empty-state h2 {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 12px;
        }
        
        .empty-state p {
          color: #94a3b8;
          margin-bottom: 24px;
        }
        
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 20px;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .detail-row {
          margin-bottom: 16px;
        }
        
        .detail-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .detail-value {
          font-size: 16px;
          color: #1e293b;
        }
        
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn-success {
          background-color: #10b981;
          color: white;
          border: none;
        }
        
        .btn-success:hover {
          background-color: #059669;
        }
        
        .btn-danger {
          background-color: #ef4444;
          color: white;
          border: none;
        }
        
        .btn-danger:hover {
          background-color: #dc2626;
        }
        
        .btn-secondary {
          background-color: #e2e8f0;
          color: #475569;
          border: none;
        }
        
        .btn-secondary:hover {
          background-color: #cbd5e1;
        }
        
        textarea.notes-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        
        .loading-spinner {
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .filters-container {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 200px;
        }
        
        .filter-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .filter-input {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 14px;
        }
        
        .filter-toggle {
          background-color: #f1f5f9;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-toggle:hover {
          background-color: #e2e8f0;
        }
        
        .filter-apply {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .filter-apply:hover {
          background-color: #2563eb;
        }
        
        .filter-reset {
          background-color: #f1f5f9;
          color: #64748b;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .filter-reset:hover {
          background-color: #e2e8f0;
        }
      `}</style>
      
      <div className="header">
        <h1>Reclamations</h1>
        {user.role === 'staff' && (
          <button 
            className="btn btn-primary"
            onClick={handleCreateReclamation}
          >
            New Reclamation
          </button>
        )}
      </div>
      
      {user.role === 'admin' && (
        <div className="stats-cards">
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p>{counts.pending}</p>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <p>{counts.approved}</p>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <p>{counts.rejected}</p>
          </div>
          <div className="stat-card">
            <h3>Processed</h3>
            <p>{counts.processed}</p>
          </div>
        </div>
      )}
      
      {/* Redesigned filters section using Pages.css classes */}
      <div className="page-actions-container">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by student ID..."
            value={studentIdFilter}
            onChange={(e) => setStudentIdFilter(e.target.value)}
            className="search-input"
          />
          
          <button 
            className="filter-button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Toggle filters"
          >
            <FaFilter className={`filter-icon ${statusFilter !== 'all' || dateFilter !== 'all' || minAmount || maxAmount ? 'filter-active' : ''}`} />
          </button>
          
          {studentIdFilter && (
            <button 
              className="clear-search-button"
              onClick={() => setStudentIdFilter('')}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      
      {showAdvancedFilters && (
        <div className="search-filters" style={{ position: 'relative', marginBottom: '20px', width: '100%' }}>
          <div className="filter-option">
            <label>Status:</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="filter-option">
            <label>Date Range:</label>
            <select 
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="date-picker-container">
              <div className="date-input-group">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  className="date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>End Date:</label>
                <input 
                  type="date" 
                  className="date-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="filter-option">
            <label>Min Amount (DT):</label>
            <input 
              type="number" 
              className="filter-input date-input"
              placeholder="Minimum amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="filter-option">
            <label>Max Amount (DT):</label>
            <input 
              type="number" 
              className="filter-input date-input"
              placeholder="Maximum amount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="filter-option">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setMinAmount('');
                setMaxAmount('');
                setStudentIdFilter('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : reclamations.length === 0 ? (
        <div className="empty-state">
          <h2>No reclamations found</h2>
          <p>There are no reclamations matching your current filters.</p>
          {user.role === 'staff' && (
            <button className="btn btn-primary" onClick={handleCreateReclamation}>
              Create Reclamation
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reclamations.map((reclamation) => (
                <tr key={reclamation.id}>
                  <td>{reclamation.staff_name}</td>
                  <td>{Number(reclamation.amount).toFixed(2)} DT</td>
                  <td>{reclamation.reason.length > 30 ? `${reclamation.reason.substring(0, 30)}...` : reclamation.reason}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(reclamation.status)}`}>
                      {reclamation.status.charAt(0).toUpperCase() + reclamation.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(reclamation.created_at)}</td>
                  <td>
                    <button className="action-button" onClick={() => handleViewDetails(reclamation)}>
                      View
                    </button>
                    {user.role === 'admin' && reclamation.status === 'pending' && (
                      <button className="action-button" onClick={() => handleProcessReclamation(reclamation)}>
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Details Modal */}
      {selectedReclamation && !showProcessModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reclamation Details</h2>
              <button className="close-button" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-label">Reclamation ID</div>
                <div className="detail-value">{selectedReclamation.id}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Staff</div>
                <div className="detail-value">{selectedReclamation.staff_name}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Student ID</div>
                <div className="detail-value">{selectedReclamation.student_id}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Amount</div>
                <div className="detail-value">{Number(selectedReclamation.amount).toFixed(2)} DT</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  <span className={`badge ${getStatusBadgeClass(selectedReclamation.status)}`}>
                    {selectedReclamation.status.charAt(0).toUpperCase() + selectedReclamation.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Reason</div>
                <div className="detail-value">{selectedReclamation.reason}</div>
              </div>
              {selectedReclamation.evidence && (
                <div className="detail-row">
                  <div className="detail-label">Evidence</div>
                  <div className="detail-value">{selectedReclamation.evidence}</div>
                </div>
              )}
              <div className="detail-row">
                <div className="detail-label">Created At</div>
                <div className="detail-value">{formatDate(selectedReclamation.created_at)}</div>
              </div>
              {selectedReclamation.status !== 'pending' && (
                <>
                  <div className="detail-row">
                    <div className="detail-label">Processed By</div>
                    <div className="detail-value">{selectedReclamation.admin_name || 'N/A'}</div>
                  </div>
                  {selectedReclamation.processed_at && (
                    <div className="detail-row">
                      <div className="detail-label">Processed At</div>
                      <div className="detail-value">{formatDate(selectedReclamation.processed_at)}</div>
                    </div>
                  )}
                  {selectedReclamation.admin_notes && (
                    <div className="detail-row">
                      <div className="detail-label">Admin Notes</div>
                      <div className="detail-value">{selectedReclamation.admin_notes}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDetails}>Close</button>
              {user.role === 'admin' && selectedReclamation.status === 'pending' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    handleCloseDetails();
                    handleProcessReclamation(selectedReclamation);
                  }}
                >
                  Process
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Process Modal */}
      {showProcessModal && selectedReclamation && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Process Reclamation</h2>
              <button 
                className="close-button" 
                onClick={() => setShowProcessModal(false)} 
                disabled={processingReclamation}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-label">Staff</div>
                <div className="detail-value">{selectedReclamation.staff_name}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Student ID</div>
                <div className="detail-value">{selectedReclamation.student_id}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Amount</div>
                <div className="detail-value">{Number(selectedReclamation.amount).toFixed(2)} DT</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Reason</div>
                <div className="detail-value">{selectedReclamation.reason}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Admin Notes (Optional)</div>
                <textarea
                  className="notes-input"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter notes about your decision"
                  disabled={processingReclamation}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowProcessModal(false)}
                disabled={processingReclamation}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleSubmitProcess('rejected')}
                disabled={processingReclamation}
              >
                {processingReclamation ? 'Processing...' : 'Reject'}
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => handleSubmitProcess('approved')}
                disabled={processingReclamation}
              >
                {processingReclamation ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 