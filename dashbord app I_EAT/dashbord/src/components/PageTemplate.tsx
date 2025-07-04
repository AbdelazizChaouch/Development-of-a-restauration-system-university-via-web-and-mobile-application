import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Pages.css';

interface PageTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accessLevel?: string[];
  actionButton?: React.ReactNode;
}

const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  subtitle,
  children,
  accessLevel,
  actionButton
}) => {
  const { user } = useAuth();
  
  // Check if user has access to this page
  const hasAccess = () => {
    if (!accessLevel || accessLevel.length === 0) return true;
    if (!user || !user.role) return false;
    return accessLevel.includes(user.role);
  };

  if (!hasAccess()) {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-container">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this page.</p>
          <p>Please contact an administrator if you believe this is a mistake.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actionButton && (
          <div className="page-actions">
            {actionButton}
          </div>
        )}
      </div>
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageTemplate; 