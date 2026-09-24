"use client";

import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-[var(--color-primary)] text-white border-none hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
  secondary:
    "bg-[var(--color-card)] text-[var(--color-ink-2)] border border-[var(--color-border)] hover:bg-[var(--color-base)] active:bg-[var(--color-base)]",
  ghost:
    "bg-transparent text-[var(--color-ink-2)] border-none hover:bg-[var(--color-base)] active:bg-[var(--color-line)]",
  danger:
    "bg-[var(--color-error)] text-white border-none hover:opacity-90 active:opacity-100",
  outline:
    "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] active:bg-[var(--color-primary-muted)]",
};

const sizeStyles = {
  sm: "h-[32px] px-3 text-[0.75rem] font-semibold",
  md: "h-[40px] px-4 text-[0.875rem] font-medium",
  lg: "h-[48px] px-6 text-[0.875rem] font-medium",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  onClick,
  className,
  type = "button",
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold transition-all duration-[var(--duration)] ease-[var(--ease)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}