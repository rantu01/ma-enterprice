"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      setUser(data.user || null);
      return data.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial session check on mount — intentional one-time sync with server
    void checkAuth();
  }, [checkAuth]);

  // Periodic session refresh to prevent unexpected logout due to
  // session timeout or token drift. Runs every 3 minutes while the user
  // is authenticated. Automatically stops when the user logs out.
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function refreshSession() {
      if (!mounted || refreshing) return;
      setRefreshing(true);
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) {
          // Session invalidated — sign out and redirect
          await logout();
          if (mounted) router.replace("/login");
          return;
        }
        const data = await res.json();
        // If server says user is null but we have a local user,
        // keep the local user so the UI doesn't flicker; the next
        // navigation will re-check.
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth session refresh error:", err);
      } finally {
        if (mounted) setRefreshing(false);
      }
    }

    // Refresh every 3 minutes (180000ms) — well under the 7-day cookie maxAge
    const interval = setInterval(refreshSession, 180000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, refreshing, logout, router]);

  async function login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Login failed" };
    }
    // Optimistically store the user from the login response so the UI
    // can navigate immediately even if the follow-up check is slow.
    if (data.user) {
      setUser(data.user);
      setLoading(false);
    }
    // Re-validate session from server so header renders reliably.
    // Keep the login user if revalidation fails (e.g. cookie timing).
    const serverUser = await checkAuth();
    return { ok: true, user: serverUser || data.user };
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Ignore network errors — still clear client state
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, refreshing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}