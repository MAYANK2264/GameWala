import { Navigate } from 'react-router-dom'
import useAuth, { type UserRole } from '../hooks/useAuth'
import React from 'react';

type PrivateRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, role, loading } = useAuth()
  if (loading) {
    return <div className="container-px py-6"><div className="card p-6">Loading...</div></div>
  }
  if (!user || role === 'inactive') {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>;
}
export default PrivateRoute;


