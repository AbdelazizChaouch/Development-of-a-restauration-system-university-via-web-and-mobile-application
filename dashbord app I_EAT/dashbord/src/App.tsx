import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Import context providers
import { AuthProvider } from './context/AuthContext'

// Import components
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'

// Import pages
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Unauthorized } from './pages/Unauthorized'
import Students from './pages/Students'
import UniversityCards from './pages/UniversityCards'
import CardActivityLogs from './pages/CardActivityLogs'
import Tickets from './pages/Tickets'
import Users from './pages/Users'
import { Reclamations } from './pages/Reclamations'
import { CreateReclamation } from './pages/CreateReclamation'

function App() {
  return (
    <div className="app-container">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes - accessible to all authenticated users */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Staff/Admin routes */}
            <Route 
              path="/students" 
              element={
                <ProtectedRoute requiredRole={['admin', 'staff', 'viewer']}>
                  <Layout>
                    <Students />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tickets" 
              element={
                <ProtectedRoute requiredRole={['admin', 'staff']}>
                  <Layout>
                    <Tickets />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/university-cards" 
              element={
                <ProtectedRoute requiredRole={['admin', 'staff']}>
                  <Layout>
                    <UniversityCards />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/card-activity-logs" 
              element={
                <ProtectedRoute requiredRole={['admin', 'staff']}>
                  <Layout>
                    <CardActivityLogs />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reclamations" 
              element={
                <ProtectedRoute requiredRole={['admin', 'staff']}>
                  <Layout>
                    <Reclamations />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-reclamation" 
              element={
                <ProtectedRoute requiredRole={['staff']}>
                  <Layout>
                    <CreateReclamation />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin-only routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect to dashboard if authenticated, otherwise to login */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            {/* Catch all other routes and redirect to dashboard */}
            <Route 
              path="*" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <div className="app-version">v1.0.0</div>
    </div>
  )
}

export default App
