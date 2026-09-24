"use client";

import { cn } from "@/lib/utils";

export default function Skeleton({ className, count = 1, width, height }) {
  const lines = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${className || ""}`}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
        height: height ? (typeof height === "number" ? `${height}px` : height) : "16px",
        marginBottom: count > 1 ? "12px" : undefined,
      }}
      aria-hidden="true"
    />
  ));

  return (
    <div className="skeleton-container" role="status" aria-label="Loading">
      {lines}
      <span className="sr-only">Loading...</span>
    </div>
  );
}