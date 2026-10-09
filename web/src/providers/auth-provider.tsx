"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Clinic, Profile, Session } from "@/types";
import { authService, type Credentials } from "@/lib/services";
import { resetDb } from "@/lib/mock/store";
import { hasPermission, type Permission } from "@/lib/domain";

const STORAGE_KEY = "klinik-gigi:session";

interface AuthContextValue {
  session: Session | null;
  user: Profile | null;
  clinic: Clinic | null;
  role: Profile["role"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  can: (permission: Permission) => boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  updateClinic: (clinic: Clinic) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const result = await authService.login(credentials);
    const next: Session = {
      user: result.user,
      clinic: result.clinic,
      token: result.token,
    };
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const updateClinic = useCallback((clinic: Clinic) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: Session = { ...prev, clinic };
      writeSession(next);
      return next;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    resetDb();
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      clinic: session?.clinic ?? null,
      role: session?.user.role ?? null,
      isLoading,
      isAuthenticated: Boolean(session),
      can: (permission) => (session ? hasPermission(session.user.role, permission) : false),
      login,
      logout,
      updateClinic,
      resetDemoData,
    }),
    [session, isLoading, login, logout, updateClinic, resetDemoData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Access the signed-in user; throws if used outside the guarded layout. */
export function useCurrentUser(): Profile {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser called outside an authenticated page");
  return user;
}