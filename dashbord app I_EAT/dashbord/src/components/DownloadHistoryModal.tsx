import React, { useEffect, useState } from 'react';
import { DownloadRecord, StudentApi } from '../services/api.service';
import '../styles/DownloadHistoryModal.css';

interface DownloadHistoryModalProps {
  studentId: number;
  studentName: string;
  onClose: () => void;
}

const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({ 
  studentId, 
  studentName, 
  onClose 
}) => {
  const [history, setHistory] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await StudentApi.getDownloadHistory(studentId);
        setHistory(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch download history:', err);
        setError('Failed to load download history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get user name from user ID (mock implementation)
  const getUserName = (userId: number): string => {
    // In a real app, you would look up the user in a users list or context
    const users = [
      { id: 1, name: 'Admin User' },
      { id: 2, name: 'Staff Member' }
    ];
    
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  return (
    <div className="download-history-backdrop" onClick={onClose}>
      <div className="download-history-container" onClick={e => e.stopPropagation()}>
        <h2 className="download-history-title">Download History</h2>
        <h3 className="download-history-subtitle">Student: {studentName}</h3>
        
        {loading && <div className="download-history-loading">Loading history...</div>}
        
        {error && <div className="download-history-error">{error}</div>}
        
        {!loading && !error && history.length === 0 && (
          <div className="download-history-empty">No download history found</div>
        )}
        
        {!loading && !error && history.length > 0 && (
          <div className="download-history-table-container">
            <table className="download-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Downloaded By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td>{formatDate(record.download_date)}</td>
                    <td>{record.download_type}</td>
                    <td>{getUserName(record.user_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="download-history-actions">
          <button 
            className="download-history-close" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadHistoryModal; 