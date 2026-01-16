import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { MapPage } from './pages/map/MapPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { ResourcePage } from './pages/resources/ResourcePage';
import { TaskBoardPage } from './pages/tasks/TaskBoardPage';
import { MyReportsPage } from './pages/reports/MyReportsPage';
import { CommandCenterPage } from './pages/admin/CommandCenterPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { PublicMapPage } from './pages/map/PublicMapPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Placeholder components for routes we haven't built yet
// All routes are now implemented


function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/public-map" element={<PublicMapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="resources" element={<ResourcePage />} />
            
            <Route 
              path="tasks" 
              element={
                <ProtectedRoute requiredScope="task:accept">
                  <TaskBoardPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredScope="incident:read:own">
                  <MyReportsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="command" 
              element={
                <ProtectedRoute requiredScope="incident:verify">
                  <CommandCenterPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Only Route */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredScope="user:read">
                  <UserManagementPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
