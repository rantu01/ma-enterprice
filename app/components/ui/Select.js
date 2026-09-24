"use client";

import { cn } from "@/lib/utils";

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled,
  className,
  ...rest
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "h-[40px] w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-[var(--text-base)] text-[var(--color-ink)] transition-all duration-[var(--duration-fast)] cursor-pointer focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] disabled:bg-[var(--color-base)] disabled:text-[var(--color-disabled)] disabled:cursor-not-allowed",
          className
        )}
        aria-disabled={disabled}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}