"use client";

export default function PageContainer({ title, breadcrumb, actions, children }) {
  return (
    <div className="flex-1 p-6 lg:p-8 overflow-auto mt-10">
      <div className="flex items-center justify-between mb-[var(--space-6)]">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[var(--text-sm)] text-[var(--color-ink-3)]">
            {breadcrumb}
          </nav>
        )}
        {actions && (
          <div className="flex items-center gap-[var(--space-3)]">
            {actions}
          </div>
        )}
      </div>

      <div className="space-y-[var(--space-6)]">{children}</div>
    </div>
  );
}