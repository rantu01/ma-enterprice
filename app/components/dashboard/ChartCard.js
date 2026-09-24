"use client";

import { cn } from "@/lib/utils";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";

export default function ChartCard({ title, children, actions, loading, className }) {
  return (
    <Card className={cn("hover:shadow-[var(--shadow-md)]", className)}>
      <div className="flex items-center justify-between mb-[var(--space-4)]">
        <h3 className="text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">{title}</h3>
        {actions && (
          <div className="flex items-center gap-[var(--space-2)]">{actions}</div>
        )}
      </div>
      {loading ? (
        <div className="w-full h-[300px] flex flex-col gap-[var(--space-3)]" aria-label="Loading chart">
          <Skeleton count={3} height={20} className="mb-[var(--space-2)]" />
          <Skeleton height={200} className="w-full" />
          <Skeleton count={2} height={16} />
        </div>
      ) : (
        <div className="relative w-full">{children}</div>
      )}
    </Card>
  );
}