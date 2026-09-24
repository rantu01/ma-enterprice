"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const toastStyles = {
  success: { borderLeft: "var(--color-success)", icon: "CheckCircle", color: "var(--color-success)" },
  error: { borderLeft: "var(--color-error)", icon: "XCircle", color: "var(--color-error)" },
  warning: { borderLeft: "var(--color-warning)", icon: "AlertTriangle", color: "var(--color-warning)" },
  info: { borderLeft: "var(--color-primary)", icon: "Info", color: "var(--color-primary)" },
};

const iconPaths = {
  CheckCircle: (
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  ),
  XCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  AlertTriangle: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  Info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
};

export default function Toast({ type = "info", title, message, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[type] || toastStyles.info;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div
      className={cn(
        "toast-enter flex items-start gap-3 w-full max-w-[400px] max-w-[90vw] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4",
        isExiting && "toast-exit",
        "min-h-[52px]"
      )}
      style={{ borderLeft: `4px solid ${style.borderLeft}` }}
      role="alert"
      aria-live="polite"
      onKeyDown={handleKeyDown}
    >
      <span className="flex-shrink-0 mt-0.5" style={{ color: style.color }} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {iconPaths[style.icon]}
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-sm)] font-semibold text-[var(--color-ink)]">{title}</p>
        {message && (
          <p className="text-[var(--text-xs)] text-[var(--color-ink-3)] mt-0.5">{message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-base)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
        aria-label="Dismiss notification"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-ink-3)]" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}