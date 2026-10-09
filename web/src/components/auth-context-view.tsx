"use client";

import { useAuth } from "@/providers/auth-provider";

/**
 * Render-prop bridge so a server page can read the client-side session
 * (role/permissions) without becoming a client component itself.
 */
export function AuthContextView({
  children,
  fallback = null,
}: {
  children: (context: {
    user: NonNullable<ReturnType<typeof useAuth>["user"]>;
    can: ReturnType<typeof useAuth>["can"];
  }) => React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, can } = useAuth();
  if (!user) return <>{fallback}</>;
  return <>{children({ user, can })}</>;
}