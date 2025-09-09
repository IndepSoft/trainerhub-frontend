
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/authStore'; 
import type { ReactNode } from 'react'; 

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/register" replace />;
};