"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigatedRef = useRef(false);

  // Already signed in → go to dashboard
  useEffect(() => {
    if (!authLoading && user && !navigatedRef.current) {
      navigatedRef.current = true;
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.ok || !result.user) {
        setError(result.error || "Login failed");
        setLoading(false);
        return;
      }
      // Auth state is already updated — navigate without a refresh
      // (refresh right after push can interrupt the navigation).
      navigatedRef.current = true;
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-base)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[var(--color-ink)]">MAA Enterprise</h1>
          <p className="text-[0.875rem] text-[var(--color-ink-3)] mt-2">Sign in to your account</p>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-lg p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@maaenterprise.com"
                  required
                  autoComplete="email"
                  className="w-full h-[40px] px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[0.875rem] text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full h-[40px] px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[0.875rem] text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>

              {error && (
                <div className="text-[0.8125rem] text-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2 rounded-md" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[40px] bg-[var(--color-primary)] text-white rounded-md font-medium text-[0.875rem] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-[var(--color-hover)] rounded-md">
            <p className="text-[0.75rem] text-[var(--color-ink-3)]">Demo accounts:</p>
            <p className="text-[0.75rem] text-[var(--color-ink-3)]">admin@maaenterprise.com / admin123</p>
            <p className="text-[0.75rem] text-[var(--color-ink-3)]">manager@maaenterprise.com / manager123</p>
            <p className="text-[0.75rem] text-[var(--color-ink-3)]">viewer@maaenterprise.com / viewer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
