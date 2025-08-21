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
    // While loading, don't make any routing decisions to prevent flicker/race
    if (loading) {
      console.debug('[AuthGate] loading auth state, holding routing decisions');
      return;
    }

    const pathname = location.pathname;
    const isDevRoute = DEV_ROUTES.includes(pathname);

    console.info('[AuthGate] routing decision', { 
      path: pathname,
      isDevOrPreview,
      isDevRoute,
      SITE_LOCKDOWN,
      authed: !!user
    });

    // Handle dev routes first - deterministic behavior
    if (isDevRoute) {
      if (isDevOrPreview) {
        console.info('[AuthGate] allowing dev route in dev/preview environment');
        return;
      } else {
        console.info('[AuthGate] blocking dev route in production, redirect to /');
        navigate('/', { replace: true });
        return;
      }
    }

    // If user is logged in AND visiting /login or /signup, redirect to /posts
    if (user && (pathname === '/login' || pathname === '/signup')) {
      console.debug('[AuthGate] authenticated user on auth page, redirect to /posts');
      navigate('/posts', { replace: true });
      return;
    }

    // For normal routes, respect existing SITE_LOCKDOWN and auth checks
    if (SITE_LOCKDOWN) {
      // If public route: allow
      if (isPublicRoute(pathname)) {
        console.debug('[AuthGate] lockdown mode: allowing public route');
        return;
      }
      // If user is authenticated: allow
      if (user) {
        console.debug('[AuthGate] lockdown mode: allowing authenticated user');
        return;
      }
      // Else: redirect to coming soon
      console.debug('[AuthGate] lockdown mode: unauthenticated on protected route, redirect to /comingsoon');
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }

    // SITE_LOCKDOWN is false
    // If public route: allow
    if (isPublicRoute(pathname)) {
      console.debug('[AuthGate] no lockdown: allowing public route');
      return;
    }
    
    // If protected route
    if (isProtectedRoute(pathname)) {
      // If user is authenticated: allow
      if (user) {
        console.debug('[AuthGate] no lockdown: allowing authenticated user on protected route');
        return;
      }
      // Else: redirect to coming soon
      console.debug('[AuthGate] no lockdown: unauthenticated on protected route, redirect to /comingsoon');
      navigate(toComingSoon(pathname + location.search), { replace: true });
      return;
    }
    
    // Unknown path: redirect to coming soon
    console.debug('[AuthGate] unknown path, redirect to /comingsoon');
    navigate(toComingSoon(pathname + location.search), { replace: true });
  }, [user, loading, location.pathname, location.search, navigate]);

  // While loading, return null to prevent flicker/loops
  if (loading) {
    return null;
  }

  return <>{children}</>;
};