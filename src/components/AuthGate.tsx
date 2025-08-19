import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SITE_LOCKDOWN } from '@/config/public';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while loading auth state
    if (loading) return;

    // Emergency kill-switch: force everyone to /comingsoon if site is locked down
    // EXCEPT allow /login and /signup even during lockdown
    if (SITE_LOCKDOWN) {
      const allowedDuringLockdown = ['/comingsoon', '/login', '/signup'];
      if (!allowedDuringLockdown.includes(location.pathname)) {
        navigate('/comingsoon', { replace: true });
      }
      return;
    }

    // Define route categories
    const publicRoutes = ['/', '/comingsoon', '/login', '/signup'];
    const resourceRoutes = ['/resources'];
    const protectedRoutes = ['/posts', '/settings', '/activity', '/simulate', '/health', '/home-legacy'];

    const currentPath = location.pathname;

    // Check if current path matches any category
    const isPublicRoute = publicRoutes.includes(currentPath);
    const isResourceRoute = resourceRoutes.some(route => currentPath.startsWith(route));
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

    // Public and resource routes are always accessible
    if (isPublicRoute || isResourceRoute) {
      // Special case: if already logged in and visiting /login or /signup, redirect to /posts
      if (user && (currentPath === '/login' || currentPath === '/signup')) {
        navigate('/posts', { replace: true });
      }
      return;
    }

    // Protected routes require authentication
    if (isProtectedRoute) {
      if (!user) {
        // Redirect to /comingsoon with from parameter for protected routes
        navigate(`/comingsoon?from=${encodeURIComponent(currentPath)}`, { replace: true });
      }
      return;
    }

    // For any other routes (like 404), let them through
  }, [user, loading, location.pathname, navigate]);

  // Show nothing while loading to prevent flicker/loops
  if (loading) {
    return null;
  }

  return <>{children}</>;
};