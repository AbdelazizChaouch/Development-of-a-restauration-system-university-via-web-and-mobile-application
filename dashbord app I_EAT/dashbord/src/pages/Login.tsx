import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export function Login() {
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^\S+@\S+$/.test(email)) {
      setEmailError('Invalid email address');
      isValid = false;
    } else {
      setEmailError(null);
    }
    
    if (!password) {
      setPasswordError('Password must not be empty');
      isValid = false;
    } else if (password.length < 3) {
      setPasswordError('Password must be at least 3 characters');
      isValid = false;
    } else {
      setPasswordError(null);
    }
    
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitError(null);
      await login(email, password);
      // After successful login, redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Left Panel - Login Form */}
      <div className="login-form-container">
        <div className="logo-section">
          <svg className="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              fill="#6366F1"
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="#6366F1" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="#6366F1" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="logo-text">I-Eat Dashboard</span>
        </div>

        <div className="login-form-wrapper">
          <h1 className="login-heading">Sign In</h1>

          {(error || submitError) && (
            <div className="error-alert">
              <strong>Authentication Error:</strong> {error || submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={emailError ? 'error' : ''}
              />
              {emailError && <div className="input-error">{emailError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={passwordError ? 'error' : ''}
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? 
                    <span>🙈</span> : 
                    <span>👁️</span>
                  }
                </button>
              </div>
              {passwordError && <div className="input-error">{passwordError}</div>}
            </div>

            <div className="form-group">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="login-help">
              <button 
                type="button" 
                className="help-button" 
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? "Hide login help" : "Need help logging in?"}
              </button>
              
              {showHint && (
                <div className="login-hint">
                  <p>Demo Accounts:</p>
                  <ul>
                    <li><strong>Admin:</strong> alice@example.com / hashed_password1</li>
                    <li><strong>Staff:</strong> bob@example.com / hashed_password2</li>
                    <li><strong>Viewer:</strong> charlie@example.com / hashed_password3</li>
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Right Panel - Welcome Banner */}
      <div className="login-banner">
        <div className="banner-content">
          <h1 className="banner-title">
            Welcome to <span>I-Eat Kit</span>
          </h1>
          <p className="banner-subtitle">
            A professional template for managing your food service operations
          </p>
        </div>
        
        
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
} 