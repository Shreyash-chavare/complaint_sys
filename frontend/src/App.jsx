import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LandingPage          from './pages/LandingPage';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import Dashboard            from './pages/Dashboard';
import NewComplaintPage     from './pages/NewComplaintPage';
import MyComplaintsPage     from './pages/MyComplaintsPage';
import PublicFeedPage       from './pages/PublicFeedPage';
import TechnicianDashboard  from './pages/TechnicianDashboard';
import TeacherDashboard     from './pages/TeacherDashboard';
import DeptAdminDashboard   from './pages/DeptAdminDashboard';
import NotFound             from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — any authenticated user */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Student only */}
          <Route path="/complaints/new" element={
            <ProtectedRoute roles={['Student']}><NewComplaintPage /></ProtectedRoute>
          } />
          <Route path="/complaints/my" element={
            <ProtectedRoute roles={['Student']}><MyComplaintsPage /></ProtectedRoute>
          } />
          <Route path="/complaints/feed" element={
            <ProtectedRoute roles={['Student', 'Teacher', 'Technician', 'DeptAdmin']}><PublicFeedPage /></ProtectedRoute>
          } />

          {/* Technician */}
          <Route path="/technician" element={
            <ProtectedRoute roles={['Technician']}><TechnicianDashboard /></ProtectedRoute>
          } />

          {/* Teacher */}
          <Route path="/teacher" element={
            <ProtectedRoute roles={['Teacher']}><TeacherDashboard /></ProtectedRoute>
          } />

          {/* DeptAdmin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['DeptAdmin']}><DeptAdminDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
