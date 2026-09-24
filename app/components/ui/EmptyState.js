"use client";

import { cn } from "@/lib/utils";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-[var(--space-12)] px-[var(--space-6)] text-center"
      role="status"
    >
      <div className="mb-[var(--space-4)] text-[var(--color-muted)]" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-ink)] mb-[var(--space-2)]">{title}</h3>
      <p className="text-[var(--text-base)] text-[var(--color-ink-3)] mb-[var(--space-6)] max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}