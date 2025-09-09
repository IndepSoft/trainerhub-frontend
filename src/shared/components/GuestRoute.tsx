
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/authStore';
import type { ReactNode } from 'react'; 

interface GuestRouteProps {
  children: ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};