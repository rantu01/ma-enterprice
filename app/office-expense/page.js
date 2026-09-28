"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import { useToast } from "@/components/contexts/ToastContext";
import {
  DollarSign,
  CalendarRange,
  CalendarClock,
  CalendarDays,
  Hourglass,
  CheckCircle2,
  XCircle,
  Receipt,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  computeOfficeExpenseOverview,
  formatMoney,
  formatMonthLabel,
  getCurrentMonthCode,
  getCurrentYear,
} from "@/lib/office-expense-utils";

const BAR_COLORS = [
  "var(--color-primary)",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#6366F1",
  "#EF4444",
];

function CategoryBreakdown({ title, subtitle, categories, total }) {
  if (!categories || categories.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-ink-3)] mt-0.5">{subtitle}</p>}
        <p className="text-xs text-[var(--color-ink-3)] py-8 text-center">No expense records for this period.</p>
      </Card>
    );
  }
  return (
    <Card>
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--color-ink-3)] mt-0.5">{subtitle}</p>}
      <ul className="mt-4 space-y-3">
        {categories.map((c, i) => (
          <li key={c.category}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--color-ink-2)] truncate">
                <span className="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} aria-hidden="true" />
                {c.category}
              </span>
              <span className="font-bold text-[var(--color-ink)] whitespace-nowrap">{formatMoney(c.total)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--color-base)] overflow-hidden" role="progressbar" aria-valuenow={c.pct} aria-valuemin="0" aria-valuemax="100" aria-label={`${c.category} ${c.pct}%`}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.pct)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[11px] text-[var(--color-ink-3)]">
              <span>{c.entries} {c.entries === 1 ? "entry" : "entries"}</span>
              <span className="font-semibold">{c.pct}% of {formatMoney(total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const EMPTY_YEAR = { total: 0, vouchers: 0, monthsRecorded: 0, avgMonthly: 0, categories: [] };
const EMPTY_MONTH = { total: 0, entries: 0, categories: [] };

export default function OfficeExpensePage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [year, setYear] = useState(() => getCurrentYear());
  const [monthYear, setMonthYear] = useState(() => getCurrentYear());
  const [month, setMonth] = useState(() => getCurrentMonthCode());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=expenseEntries", { cache: "no-store" });
        if (res.ok) setEntries((await res.json()).data || []);
        else addToast({ type: "error", title: "Error", message: "Failed to load expense entries." });
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load expense entries." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const overview = useMemo(() => computeOfficeExpenseOverview(entries), [entries]);

  const yearOptions = useMemo(() => {
    const set = new Set([...(overview.years || []), getCurrentYear()]);
    return [...set].sort().map((y) => ({ value: y, label: y }));
  }, [overview]);

  // Effective selections are derived during render (no cascading effects):
  // an out-of-range selection falls back to the latest valid option.
  const validYears = useMemo(() => yearOptions.map((o) => o.value), [yearOptions]);
  const effectiveYear = validYears.includes(year) ? year : (validYears[validYears.length - 1] || getCurrentYear());
  const effectiveMonthYear = validYears.includes(monthYear) ? monthYear : effectiveYear;

  const monthOptions = useMemo(() => {
    if (!overview.byMonth) return [];
    return Object.keys(overview.byMonth).filter((m) => m.startsWith(`${effectiveMonthYear}-`)).sort();
  }, [overview, effectiveMonthYear]);

  const effectiveMonth = (() => {
    if (monthOptions.includes(month)) return month;
    const current = getCurrentMonthCode();
    if (monthOptions.includes(current)) return current;
    return monthOptions[monthOptions.length - 1] || current;
  })();

  const yearStats = overview.byYear?.[effectiveYear] || EMPTY_YEAR;
  const monthStats = overview.byMonth?.[effectiveMonth] || EMPTY_MONTH;
  const thisYearStats = overview.byYear?.[getCurrentYear()] || EMPTY_YEAR;
  const thisMonthStats = overview.byMonth?.[getCurrentMonthCode()] || EMPTY_MONTH;
  const approvals = overview.approvalCounts || { pending: 0, approved: 0, rejected: 0 };

  const recentEntries = useMemo(() => [...entries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 8), [entries]);

  const recentColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => (v ? String(v).slice(0, 10) : "—") },
    { key: "voucherNo", label: "Voucher", accessor: "voucherNo", sortable: true, render: (v) => v || "—" },
    { key: "category", label: "Category", accessor: "category", sortable: true, render: (v, row) => `${v || "—"}${row.subCategory ? ` / ${row.subCategory}` : ""}` },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    {
      key: "approvalStatus", label: "Status", accessor: "approvalStatus", sortable: true,
      render: (v, row) => {
        const s = v || row.status || "Approved";
        return <Badge variant={s === "Approved" ? "active" : s === "Rejected" ? "cancelled" : "pending"}>{s}</Badge>;
      },
    },
  ];

  return (
    <PageContainer
      title="Office Expense"
      breadcrumb={<span>Office Expense</span>}
      actions={<Link href="/office-expense/data-entry"><Button variant="primary" size="sm">+ Add Daily Expense</Button></Link>}
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><Skeleton height={96} /></Card>
          ))}
        </div>
      ) : (
        <>
          <section aria-label="Key metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Lifetime Expense" value={formatMoney(overview.lifetime.total)} subtext={`${overview.lifetime.vouchers} Vouchers`} icon={<DollarSign className="h-5 w-5" aria-hidden="true" />} variant="info" />
              <StatCard title="This Year Expense" value={formatMoney(thisYearStats.total)} subtext={`${thisYearStats.monthsRecorded} Months Recorded`} icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />} variant="warning" />
              <StatCard title="This Month Expense" value={formatMoney(thisMonthStats.total)} subtext={`${thisMonthStats.entries} Vouchers`} icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />} variant="default" />
              <StatCard title="Months Recorded" value={overview.totalMonthsRecorded.toLocaleString()} subtext="Unique months" icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} variant="success" />
              <StatCard title="Pending" value={approvals.pending.toLocaleString()} subtext="Awaiting review" icon={<Hourglass className="h-5 w-5" aria-hidden="true" />} variant="warning" />
              <StatCard title="Approved" value={approvals.approved.toLocaleString()} subtext="Approved entries" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} variant="success" />
              <StatCard title="Rejected" value={approvals.rejected.toLocaleString()} subtext="Rejected entries" icon={<XCircle className="h-5 w-5" aria-hidden="true" />} variant="error" />
              <StatCard title="Yearly Avg / Month" value={formatMoney(yearStats.avgMonthly)} subtext={`Year ${effectiveYear}`} icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />} variant="default" />
            </div>
          </section>

          <section aria-label="Yearly insights" className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" /> Yearly Expense Insights
              </h2>
              <FormField label="Year" id="overview-year" className="w-full sm:w-40">
                <Select value={effectiveYear} onChange={(e) => setYear(e.target.value)} options={yearOptions} placeholder="Select year" id="overview-year" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Expense" value={formatMoney(yearStats.total)} subtext={`Year ${effectiveYear}`} icon={<Receipt className="h-5 w-5" aria-hidden="true" />} variant="info" />
              <StatCard title="Total Vouchers" value={yearStats.vouchers.toLocaleString()} subtext={`Year ${effectiveYear}`} icon={<Receipt className="h-5 w-5" aria-hidden="true" />} variant="warning" />
              <StatCard title="Months Recorded" value={yearStats.monthsRecorded.toLocaleString()} subtext={yearStats.monthsRecorded === 1 ? "1 Month Recorded" : `${yearStats.monthsRecorded} Months Recorded`} icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} variant="success" />
              <StatCard title="Average Monthly" value={formatMoney(yearStats.avgMonthly)} subtext="Recorded months only" icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />} variant="default" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <CategoryBreakdown title="Category-wise Expense Details" subtitle={`Year ${effectiveYear} · sorted by highest expense`} categories={yearStats.categories} total={yearStats.total} />
              <Card>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Monthly Breakdown — {effectiveYear}</h3>
                <p className="text-xs text-[var(--color-ink-3)] mt-0.5">Approved spend per recorded month</p>
                {(yearStats.months || []).length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-3)] py-8 text-center">No months recorded for {effectiveYear}.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {(yearStats.months || []).map((m) => {
                      const t = overview.byMonth?.[m]?.total || 0;
                      const pct = yearStats.total > 0 ? Math.min(100, (t / yearStats.total) * 100) : 0;
                      return (
                        <li key={m}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-[var(--color-ink-2)]">{formatMonthLabel(m)}</span>
                            <span className="font-bold text-[var(--color-ink)]">{formatMoney(t)}</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-[var(--color-base)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </section>

          <section aria-label="Monthly insights" className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" /> Monthly Expense Insights
              </h2>
              <div className="flex flex-wrap gap-3">
                <FormField label="Year" id="overview-month-year" className="w-full sm:w-36">
                  <Select value={effectiveMonthYear} onChange={(e) => setMonthYear(e.target.value)} options={yearOptions} placeholder="Select year" id="overview-month-year" />
                </FormField>
                <FormField label="Month" id="overview-month" className="w-full sm:w-48">
                  <Select value={monthOptions.includes(effectiveMonth) ? effectiveMonth : ""} onChange={(e) => setMonth(e.target.value)}
                    options={monthOptions.length === 0 ? [{ value: "", label: "No months" }] : monthOptions.map((m) => ({ value: m, label: formatMonthLabel(m) }))}
                    placeholder="Select month" id="overview-month" />
                </FormField>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Expense" value={formatMoney(monthStats.total)} subtext={formatMonthLabel(effectiveMonth)} icon={<DollarSign className="h-5 w-5" aria-hidden="true" />} variant="info" />
              <StatCard title="Total Entries" value={monthStats.entries.toLocaleString()} subtext={formatMonthLabel(effectiveMonth)} icon={<Receipt className="h-5 w-5" aria-hidden="true" />} variant="warning" />
              <StatCard title="Categories Used" value={(monthStats.categories || []).length.toLocaleString()} subtext={formatMonthLabel(effectiveMonth)} icon={<Layers className="h-5 w-5" aria-hidden="true" />} variant="success" />
            </div>
            <div className="mt-4">
              <CategoryBreakdown title="Category-wise Expense Details" subtitle={`${formatMonthLabel(effectiveMonth)} · sorted by highest expense`} categories={monthStats.categories} total={monthStats.total} />
            </div>
          </section>

          <section aria-label="Recent entries" className="mt-6">
            <Card padding="0">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-ink)]">Recent Entries</h2>
                  <p className="text-xs text-[var(--color-ink-3)]">Latest {recentEntries.length} vouchers across all months</p>
                </div>
                <Link href="/office-expense/data-entry"><Button variant="outline" size="sm">View All</Button></Link>
              </div>
              <DataTable columns={recentColumns} data={recentEntries} emptyMessage="No expense entries yet. Add your first daily expense." />
            </Card>
          </section>
        </>
      )}
    </PageContainer>
  );
}
