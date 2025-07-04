import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';
import { ChartBarIcon, UsersIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import iEatLogo from '../assets/i_eat_logo.png';

// Interface for menu items
interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  roles?: string[]; // Add roles array to restrict menu items to specific roles
  limitedFor?: string[]; // Array of roles with limited access
}

// Properties for the Sidebar component
interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || '';
  
  // General section menu items
  const generalMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
        </svg>
      ),
      path: '/dashboard',
    },
    {
      title: 'Students',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
        </svg>
      ),
      path: '/students',
    },
    {
      title: 'University Cards',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor" />
        </svg>
      ),
      path: '/university-cards',
      badge: 7,
      roles: ['admin', 'staff'], // Now visible to staff too
      limitedFor: ['staff'] // Staff has limited access
    },
    {
      title: 'Card Activity Logs',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor" />
        </svg>
      ),
      path: '/card-activity-logs',
      roles: ['admin', 'staff'], // Visible to admin and staff
    },
    {
      title: 'Tickets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 10V6C22 4.89 21.1 4 20 4H4C2.9 4 2.01 4.89 2.01 6V10C3.11 10 4 10.9 4 12S3.11 14 2 14V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V14C20.9 14 20 13.1 20 12S20.9 10 22 10ZM20 8.54C18.81 9.23 18 10.53 18 12S18.81 14.77 20 15.46V18H4V15.46C5.19 14.77 6 13.47 6 12C6 10.5 5.2 9.23 4 8.54L4 6H20V8.54ZM9.07 16L12 14.12L14.93 16L14.32 12.64L16.82 10.18L13.45 9.68L12 6.5L10.55 9.67L7.18 10.17L9.68 12.63L9.07 16Z" fill="currentColor" />
        </svg>
      ),
      path: '/tickets',
      roles: ['admin', 'manager', 'staff'] // Staff can manage tickets
    },
    {
      title: 'Reclamations',
      icon: <ExclamationCircleIcon className="w-5 h-5" />,
      path: '/reclamations',
      roles: ['admin', 'staff']
    }
  ];

  // Extra section menu items
  const extraMenuItems: MenuItem[] = [
    {
      title: 'Users',
      icon: <UsersIcon className="w-5 h-5" />,
      path: '/users',
      roles: ['admin']
    },
  ];

  // Filter menu items based on user role
  const filteredGeneralItems = generalMenuItems.filter(item => 
    !item.roles || (userRole && item.roles.includes(userRole))
  );
  
  const filteredExtraItems = extraMenuItems.filter(item => 
    !item.roles || (userRole && item.roles.includes(userRole))
  );

  // Function to render menu section
  const renderMenuSection = (items: MenuItem[], sectionTitle?: string) => (
    <div className="sidebar-section">
      {sectionTitle && !collapsed && <div className="sidebar-section-title">{sectionTitle}</div>}
      <ul className="sidebar-menu">
        {items.map((item, index) => {
          const isAdminOnly = item.roles && item.roles.length === 1 && item.roles.includes('admin');
          const isLimited = item.limitedFor && userRole && item.limitedFor.includes(userRole);
          
          return (
            <li key={index} className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}>
              <Link to={item.path} className="sidebar-menu-link">
                <span className="sidebar-menu-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-menu-text">{item.title}</span>}
                {!collapsed && item.badge && <span className="sidebar-badge">{item.badge}</span>}
                {collapsed && item.badge && <span className="sidebar-badge-collapsed">{item.badge}</span>}
                {collapsed && <span className="sidebar-menu-tooltip">{item.title}</span>}
                {!collapsed && isAdminOnly && <span className="admin-only-indicator">Admin</span>}
                {!collapsed && isLimited && <span className="limited-access-indicator">Limited</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <>
            <div className="sidebar-brand">
              <img src={iEatLogo} alt="I EAT Logo" className="sidebar-logo" />
              <span className="sidebar-title"></span>
            </div>
          </>
        ) : (
          <div className="sidebar-brand-collapsed">
            <img src={iEatLogo} alt="I EAT Logo" className="sidebar-logo" />
          </div>
        )}
        <button 
          className="sidebar-toggle" 
          onClick={onToggleCollapse} 
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="sidebar-content">
        {renderMenuSection(filteredGeneralItems, 'General')}
        {renderMenuSection(filteredExtraItems, 'Extra')}
      </div>

      <div className="sidebar-footer">
      
      </div>
    </div>
  );
} 