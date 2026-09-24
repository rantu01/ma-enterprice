"use client";

import { cn } from "@/lib/utils";
import Skeleton from "../ui/Skeleton";

export default function ActivityList({ items, loading, className }) {
  if (loading) {
    return (
      <div className={cn("flex flex-col gap-[var(--space-3)]", className)} aria-label="Loading activities">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-[var(--space-3)] p-[var(--space-3)]">
            <Skeleton className="rounded-full" width={36} height={36} />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton height={14} width="60%" />
              <Skeleton height={12} width="40%" />
            </div>
            <Skeleton height={12} width={80} />
          </div>
        ))}
        <span className="sr-only">Loading activities</span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center" role="status">
        <div className="mb-[var(--space-4)] text-[var(--color-muted)]" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-ink)] mb-[var(--space-2)]">No activities yet</h3>
        <p className="text-[var(--text-base)] text-[var(--color-ink-3)]">Recent activity will appear here.</p>
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col divide-y divide-[var(--color-line)]", className)} role="list" aria-label="Recent activities">
      {items.map((item, index) => (
        <li
          key={item.id || index}
          className="flex items-center gap-[var(--space-3)] py-[var(--space-3)] px-[var(--space-4)] hover:bg-[var(--color-base)] transition-colors first:rounded-t-lg last:rounded-b-lg"
        >
          <div
            className="flex-shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center bg-[var(--color-base)] text-[var(--color-muted)]"
            aria-hidden="true"
          >
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-base)] font-medium text-[var(--color-ink)] truncate">
              {item.title}
            </p>
            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] truncate">
              {item.description}
            </p>
          </div>
          <time className="flex-shrink-0 text-[var(--text-xs)] text-[var(--color-muted)]" dateTime={item.timestamp}>
            {item.timestamp}
          </time>
        </li>
      ))}
    </ul>
  );
}