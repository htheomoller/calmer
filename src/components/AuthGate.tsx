import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SITE_LOCKDOWN } from '@/config/public';

const isDev = !import.meta.env.PROD;
const DEV_TOOL_ROUTES = ['/self-test', '/health']; // add more later if needed

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
    // EXCEPT allow /login even during lockdown
    // AND allow authenticated users full access to protected routes
    // AND allow dev tools in development
    if (SITE_LOCKDOWN) {
      const pathname = location.pathname;
      const isPublic =
        pathname === '/' ||
        pathname === '/comingsoon' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname.startsWith('/resources');

      const isDevTool = isDev && DEV_TOOL_ROUTES.some(p => pathname.startsWith(p));

      // Allow authenticated users full access to protected routes
      const protectedRoutes = ['/posts', '/settings', '/activity', '/simulate', '/home-legacy'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      if (isProtectedRoute && user) {
        return;
      }

      if (!isPublic && !isDevTool) {
        const from = encodeURIComponent(pathname + location.search);
        navigate(`/comingsoon?from=${from}`, { replace: true });
      }
      return;
    }

    // Define route categories
    const publicRoutes = ['/', '/comingsoon', '/login'];
    const resourceRoutes = ['/resources'];
    const protectedRoutes = ['/posts', '/settings', '/activity', '/simulate', '/health', '/home-legacy'];

    const currentPath = location.pathname;

    // Check if current path matches any category
    const isPublicRoute = publicRoutes.includes(currentPath);
    const isResourceRoute = resourceRoutes.some(route => currentPath.startsWith(route));
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

    // Public and resource routes are always accessible
    if (isPublicRoute || isResourceRoute) {
      // Special case: if already logged in and visiting /login, redirect to /posts
      // Note: /signup is no longer a public route, so it will be blocked
      if (user && currentPath === '/login') {
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

    // For any other routes (like 404, /signup), redirect to /comingsoon
    if (currentPath === '/signup' || !isPublicRoute && !isResourceRoute && !isProtectedRoute) {
      navigate('/comingsoon', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // Show nothing while loading to prevent flicker/loops
  if (loading) {
    return null;
  }

  return <>{children}</>;
};