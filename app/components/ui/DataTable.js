"use client";

import { useState, useMemo } from "react";
import Pagination from "./Pagination";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DataTable({
  columns = [],
  data = [],
  toolbar,
  pagination,
  loading,
  emptyMessage = "No records found.",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) =>
          String(row[col.accessor || col.key] || "").toLowerCase().includes(query)
        )
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, searchQuery, sortConfig, columns]);

  const paginatedData = pagination
    ? filteredAndSortedData.slice(
        (pagination.currentPage - 1) * pagination.itemsPerPage,
        pagination.currentPage * pagination.itemsPerPage
      )
    : filteredAndSortedData;

  if (loading) {
    return (
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-line)]">
          <div className="h-10 bg-[var(--color-base)] rounded-[var(--radius-md)] animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-[var(--color-line)]">
            <div className="h-4 bg-[var(--color-base)] rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden"
      role="region"
      aria-label="Data table"
    >
      {toolbar && (
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-line)] flex-wrap">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="bg-[var(--color-base)] border-b border-[var(--color-line)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-2)] text-left cursor-pointer hover:bg-[var(--color-hover)] select-none"
                  onClick={() => col.sortable && handleSort(col.key || col.accessor)}
                  style={{ minWidth: col.minWidth }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortConfig.key === (col.key || col.accessor) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                        className={cn(
                          "text-[var(--color-ink-2)]",
                          sortConfig.direction === "desc" && "rotate-180"
                        )}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[var(--text-sm)] text-[var(--color-ink-2)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="border-b border-[var(--color-line)] bg-[var(--color-card)] hover:bg-[var(--color-base)] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-[13px] text-[var(--color-ink)]"
                    >
                      {col.render
                        ? col.render(row[col.accessor || col.key], row)
                        : row[col.accessor || col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          showingText={pagination.showingText}
        />
      )}
    </div>
  );
}