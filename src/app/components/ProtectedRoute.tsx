import { Navigate } from 'react-router-dom';
import type { User } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: ('customer' | 'seller' | 'admin' | 'guest')[];
  children: React.ReactNode;
}

export function ProtectedRoute({ user, allowedRoles, children }: ProtectedRouteProps) {
  // Check if 'guest' is allowed (for customer pages that allow browsing without login)
  const guestAllowed = allowedRoles.includes('guest');
  
  // If no user and guest is allowed, show the page
  if (!user && guestAllowed) {
    return <>{children}</>;
  }
  
  // If no user and guest is NOT allowed, redirect to login
  if (!user && !guestAllowed) {
    return <Navigate to="/login" replace />;
  }
  
  // User exists - check if their role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    switch (user.role) {
      case 'seller':
        return <Navigate to="/seller/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'customer':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // User has correct role - allow access
  return <>{children}</>;
}