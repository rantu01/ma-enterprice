"use client";

import { cn } from "@/lib/utils";

export default function FormSection({ title, children, className }) {
  return (
    <section className={cn("flex flex-col gap-[var(--space-4)]", className)}>
      <div className="flex items-center gap-3">
        <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-ink)]">{title}</h3>
        <div className="flex-1 h-px bg-[var(--color-line)]" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-[var(--space-4)]">{children}</div>
    </section>
  );
}