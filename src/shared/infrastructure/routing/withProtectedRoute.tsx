import { ProtectedRoute } from "@/auth/components/ProtectedRoute";
import type { JSX } from "react";

export function withProtectedRoute(element: JSX.Element) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}