import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { GuestRoute } from '@/shared/components/GuestRoute';

const RootLayout = lazy(() => import('@/app/layouts/RootLayout'));
const Register = lazy(() => import('@/auth/pages/Register'));
const Dashboard = lazy(() => import('@/dashboard/pages/Dashboard'));
const NotFound = lazy(() => import('@/shared/pages/NotFound'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <RootLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <Register />
            </Suspense>
          </GuestRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);