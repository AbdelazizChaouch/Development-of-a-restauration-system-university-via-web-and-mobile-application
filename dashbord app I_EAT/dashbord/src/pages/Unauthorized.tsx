import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Unauthorized.css';

export function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <h1 className="unauthorized-title">Access Denied</h1>
        
        <div className="unauthorized-image">
          <img 
            src="https://illustrations.popsy.co/red/access-denied.svg" 
            alt="Unauthorized Access" 
          />
        </div>
        
        <p className="unauthorized-message">
          Sorry {user?.name}, you don't have permission to access this area.
        </p>
        
        <p className="unauthorized-details">
          Your current role ({user?.role}) doesn't have the required permissions for this section.
          Please contact an administrator if you believe this is an error.
        </p>
        
        <div className="unauthorized-actions">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="action-button outline"
          >
            Return to Dashboard
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="action-button filled"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
} 