import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SITE_LOCKDOWN } from "@/config/public";

interface LockdownRedirectProps {
  children: React.ReactNode;
}

export const LockdownRedirect = ({ children }: LockdownRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (SITE_LOCKDOWN) {
      const protectedRoutes = ['/login', '/signup', '/posts', '/settings', '/activity', '/simulate'];
      
      if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/comingsoon', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};