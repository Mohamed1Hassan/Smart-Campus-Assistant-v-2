"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: (
    | "student"
    | "professor"
    | "admin"
    | "STUDENT"
    | "PROFESSOR"
    | "ADMIN"
  )[];
}

// Memoized ProtectedRoute component for better performance
export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  // Normalized roles
  const userRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
  const isAllowed = userRole
    ? normalizedAllowedRoles.includes(userRole)
    : false;

  // Wait for initialization to complete before redirecting
  let shouldRedirect: string | null = null;
  if (!isLoading && isInitialized) {
    if (!isAuthenticated || !user) {
      shouldRedirect = "/login";
    } else if (!isAllowed) {
      if (userRole === "student") shouldRedirect = "/student-dashboard";
      else if (userRole === "professor" || userRole === "admin")
        shouldRedirect = "/professor-dashboard";
      else shouldRedirect = "/login";
    }
  }

  useEffect(() => {
    if (shouldRedirect) {
      if (process.env.NODE_ENV === "development") {
        console.log(`ProtectedRoute: Redirecting to ${shouldRedirect}`);
      }
      router.replace(shouldRedirect);
    }
  }, [shouldRedirect, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}
