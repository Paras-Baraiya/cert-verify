import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCertificate from './pages/VerifyCertificate';
import AdminDashboard from './pages/AdminDashboard';
import MyCertificates from './pages/MyCertificates';
import AdminCreatePage from './pages/AdminCreatePage';

// Route guard for protected routes
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/setup-admin" element={<AdminCreatePage />} />
          <Route path="/my-certificates" element={
            <PrivateRoute><MyCertificates /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
