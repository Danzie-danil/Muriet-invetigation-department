import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
        <div className="spinner"></div> {/* Using the global spinner class */}
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no profile yet (edge case where profile isn't generated yet)
  // or if allowed roles are specified and user role doesn't match
  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to dashboard (or a 'forbidden' page). For now, back to root dashboard.
    return <Navigate to="/" replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
