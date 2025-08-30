import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { initializeAuth } from './store/slices/authSlice';

// Components
import AuthGuard from './components/auth/AuthGuard';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentList from './pages/teacher/StudentList';
import TimeTracking from './pages/teacher/TimeTracking';
import FinancialSummary from './pages/teacher/FinancialSummary';
import ClassesPage from './pages/teacher/ClassesPage';
import ReportsPage from './pages/teacher/ReportsPage';
import TeachersPage from './pages/admin/TeachersPage';
import AccountingPage from './pages/admin/AccountingPage';
import SystemSettings from './pages/admin/SystemSettings';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="loading-spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
  </div>
);

// App content component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <AuthGuard>
              <DashboardLayout>
                {user?.role === 'admin' ? <AdminDashboard /> : <TeacherDashboard />}
              </DashboardLayout>
            </AuthGuard>
          } />
          
          {/* Teacher routes */}
          <Route path="/students" element={
            <AuthGuard>
              <DashboardLayout>
                <StudentList />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/classes" element={
            <AuthGuard>
              <DashboardLayout>
                <ClassesPage />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/time-tracking" element={
            <AuthGuard>
              <DashboardLayout>
                <TimeTracking />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/financial" element={
            <AuthGuard>
              <DashboardLayout>
                <FinancialSummary />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/reports" element={
            <AuthGuard>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          {/* Admin routes */}
          <Route path="/teachers" element={
            <AuthGuard>
              <DashboardLayout>
                <TeachersPage />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/accounting" element={
            <AuthGuard>
              <DashboardLayout>
                <AccountingPage />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          <Route path="/settings" element={
            <AuthGuard>
              <DashboardLayout>
                <SystemSettings />
              </DashboardLayout>
            </AuthGuard>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
