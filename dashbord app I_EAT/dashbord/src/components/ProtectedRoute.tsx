import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  // Check if user is logged in
  if (!isLoggedIn) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role check is required
  if (requiredRole && user) {
    // If requiredRole is an array, check if user's role is in the array
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.role)) {
        // User doesn't have required role, redirect to unauthorized page
        return <Navigate to="/unauthorized" replace />;
      }
    } 
    // If requiredRole is a string, check if user's role matches
    else if (user.role !== requiredRole) {
      // User doesn't have required role, redirect to unauthorized page
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If all checks pass, render the children
  return <>{children}</>;
} 