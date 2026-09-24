"use client";

import { cn } from "@/lib/utils";

const paddingMap = {
  "0": "p-0",
  "2": "p-2",
  "3": "p-3",
  "4": "p-4",
  "5": "p-5",
  "6": "p-[var(--space-6)]",
  "8": "p-[var(--space-8)]",
};

export default function Card({ children, className, hover = false, padding = "6" }) {
  return (
    <div
      className={cn(
        "bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]",
        hover && "hover:shadow-[var(--shadow-md)] hover:transition-shadow",
        paddingMap[padding] || paddingMap["6"],
        className
      )}
    >
      {children}
    </div>
  );
}