"use client";

import { cn } from "@/lib/utils";

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  error,
  className,
  id,
  ...rest
}) {
  return (
    <div className="flex flex-col gap-[var(--space-1)] w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-[40px] w-full rounded-[var(--radius-md)] border px-3 py-2 text-[var(--text-base)] transition-all duration-[var(--duration-fast)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]",
          disabled && "bg-[var(--color-base)] text-[var(--color-disabled)] cursor-not-allowed",
          error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_rgba(185,28,28,0.1)]",
          "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-ink)] dark:text-[var(--color-ink)]",
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-error`} className="text-[var(--text-xs)] text-[var(--color-error)]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}