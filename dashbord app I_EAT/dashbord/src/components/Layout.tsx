import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Toggle sidebar collapse state
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="layout-container">
      <Sidebar 
        collapsed={collapsed} 
        onToggleCollapse={handleToggleCollapse} 
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout; 