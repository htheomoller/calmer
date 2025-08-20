import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SITE_LOCKDOWN } from '@/config/public';

const PUBLIC_ALWAYS = ['/', '/comingsoon', '/login', '/signup'];
const PUBLIC_DEV = ['/health', '/dev/breadcrumbs', '/self-test'];
const RESOURCE_PREFIXES = ['/resources'];
const PROTECTED_PREFIXES = ['/posts', '/settings', '/activity', '/simulate', '/home-legacy'];

const isDev = !import.meta.env.PROD;

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p));

const isPublicRoute = (path: string) =>
  startsWithAny(path, PUBLIC_ALWAYS) ||
  RESOURCE_PREFIXES.some(p => path.startsWith(p)) ||
  (isDev && startsWithAny(path, PUBLIC_DEV));

const isProtectedRoute = (path: string) =>
  PROTECTED_PREFIXES.some(p => path.startsWith(p));

const toComingSoon = (from: string) => `/comingsoon?from=${encodeURIComponent(from)}`;

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

    const pathname = location.pathname;

    // Allow dev routes when not in production
    if (!import.meta.env.PROD && PUBLIC_DEV.includes(pathname)) return;

    // If user is logged in AND visiting /login or /signup, redirect to /posts
    if (user && (pathname === '/login' || pathname === '/signup')) {
      navigate('/posts', { replace: true });
      return;
    }

    // If SITE_LOCKDOWN is true
    if (SITE_LOCKDOWN) {
      // If isPublicRoute: allow children
      if (isPublicRoute(pathname)) {
        return;
      }
      // Else if user is authenticated: allow children
      if (user) {
        return;
      }
      // Else: navigate to comingsoon
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }

    // If SITE_LOCKDOWN is false
    // If isPublicRoute: allow children
    if (isPublicRoute(pathname)) {
      return;
    }
    // Else if isProtectedRoute:
    if (isProtectedRoute(pathname)) {
      // If user is authenticated: allow children
      if (user) {
        return;
      }
      // Else: navigate to comingsoon
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }
    // Else: Unknown path: send to comingsoon but preserve "from"
    navigate(toComingSoon(pathname + location.search), { replace: true });
  }, [user, loading, location.pathname, location.search, navigate]);

  // Show nothing while loading to prevent flicker/loops
  if (loading) {
    return null;
  }

  return <>{children}</>;
};