"use client";

import { cn } from "@/lib/utils";

export default function ErrorState({ title, description, onRetry }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-[var(--space-12)] px-[var(--space-6)] text-center"
      role="alert"
    >
      <div className="mb-[var(--space-4)] text-[var(--color-error)]" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-ink)] mb-[var(--space-2)]">{title}</h3>
      <p className="text-[var(--text-base)] text-[var(--color-ink-3)] mb-[var(--space-6)] max-w-md">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-[40px] px-[var(--space-6)] bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-[var(--text-base)] font-medium hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] transition-all duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          type="button"
        >
          Try Again
        </button>
      )}
    </div>
  );
}