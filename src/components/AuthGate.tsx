import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SITE_LOCKDOWN } from '@/config/public';

// Dev-only routes open in dev/preview, locked in prod
const DEV_ROUTES = ['/health', '/self-test', '/dev/breadcrumbs'];
const PUBLIC_ALWAYS = ['/', '/comingsoon', '/login', '/signup'];
const RESOURCE_PREFIXES = ['/resources'];
const PROTECTED_PREFIXES = ['/posts', '/settings', '/activity', '/simulate', '/home-legacy'];

// Detect dev/preview environment
const isDevOrPreview = import.meta.env.DEV || 
                      import.meta.env.MODE === 'development' || 
                      import.meta.env.MODE === 'preview';

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p));

const isPublicRoute = (path: string) =>
  startsWithAny(path, PUBLIC_ALWAYS) ||
  RESOURCE_PREFIXES.some(p => path.startsWith(p));

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
    if (loading) {
      console.debug('[AuthGate] loading… hold routing');
      return;
    }

    const pathname = location.pathname;
    const isDevRoute = DEV_ROUTES.includes(pathname);

    console.info('[AuthGate] routing state', { 
      path: pathname,
      isDevOrPreview,
      SITE_LOCKDOWN,
      isDevRoute,
      authed: !!user
    });

    // Handle dev routes first - deterministic behavior
    if (isDevRoute) {
      if (isDevOrPreview) {
        console.info('[AuthGate] allow dev route in dev/preview');
        return;
      } else {
        console.info('[AuthGate] block dev route in production → /');
        navigate('/', { replace: true });
        return;
      }
    }

    // If user is logged in AND visiting /login or /signup, redirect to /posts
    if (user && (pathname === '/login' || pathname === '/signup')) {
      console.debug('[AuthGate] authed user on auth page → /posts');
      navigate('/posts', { replace: true });
      return;
    }

    // If SITE_LOCKDOWN is true
    if (SITE_LOCKDOWN) {
      // If isPublicRoute: allow children
      if (isPublicRoute(pathname)) {
        console.debug('[AuthGate] lockdown: allow public route');
        return;
      }
      // Else if user is authenticated: allow children
      if (user) {
        console.debug('[AuthGate] lockdown: allow authed user');
        return;
      }
      // Else: navigate to comingsoon
      console.debug('[AuthGate] lockdown: unauthed on protected → /comingsoon');
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }

    // If SITE_LOCKDOWN is false
    // If isPublicRoute: allow children
    if (isPublicRoute(pathname)) {
      console.debug('[AuthGate] no lockdown: allow public route');
      return;
    }
    // Else if isProtectedRoute:
    if (isProtectedRoute(pathname)) {
      // If user is authenticated: allow children
      if (user) {
        console.debug('[AuthGate] no lockdown: allow authed on protected');
        return;
      }
      // Else: navigate to comingsoon
      console.debug('[AuthGate] no lockdown: unauthed on protected → /comingsoon');
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }
    // Else: Unknown path: send to comingsoon but preserve "from"
    console.debug('[AuthGate] unknown path → /comingsoon');
    navigate(toComingSoon(pathname + location.search), { replace: true });
  }, [user, loading, location.pathname, location.search, navigate]);

  // Show nothing while loading to prevent flicker/loops
  if (loading) {
    return null;
  }

  return <>{children}</>;
};