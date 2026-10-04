"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import SummaryBox from "@/components/dashboard/SummaryBox";
import ChartCard from "@/components/dashboard/ChartCard";
import ActivityList from "@/components/dashboard/ActivityList";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import FormField from "@/components/forms/FormField";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Building2,
  HandCoins,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import {
  loanTotalPayable,
  loanPaidAmount,
  loanAutoStatus,
  computeLoanSummary,
  formatMoney as formatLoanMoney,
} from "@/lib/loan-utils";
import {
  computeDashboard,
  yearMonthCodes,
  yearlyProfitCounts,
  monthLabel,
  shortMonthLabel,
  formatMoney,
} from "@/lib/dashboard-utils";

/* ---------- Yearly bar charts (pure CSS, real data only) ---------- */

function ScaleBarChart({ values, colorFor, emptyMessage, formatValue }) {
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(Number(v.value) || 0)));
  if (values.every((v) => Number(v.value) === 0)) {
    return <p className="text-xs text-[var(--color-ink-3)] py-12 text-center">{emptyMessage}</p>;
  }
  return (
    <div
      className="w-full overflow-x-auto"
      role="img"
      aria-label={values.map((v) => `${v.label}: ${formatValue(v.value)}`).join(", ")}
    >
      <div className="flex items-end justify-between gap-2 px-2 min-w-[560px] h-[260px]">
        {values.map((v) => {
          const val = Number(v.value) || 0;
          const height = Math.max(val === 0 ? 2 : 4, (Math.abs(val) / maxAbs) * 190);
          return (
            <div key={v.key} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
              <span className="text-[0.6875rem] font-medium text-[var(--color-ink-2)] whitespace-nowrap" title={formatValue(val)}>
                {val === 0 ? "—" : formatValue(val)}
              </span>
              <div
                className="w-full rounded-t-md"
                style={{ height: `${height}px`, backgroundColor: colorFor(val) }}
                title={`${v.label}: ${formatValue(val)}`}
              />
              <span className="text-[0.6875rem] text-[var(--color-ink-3)]">{v.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfitLossChart({ values }) {
  const compact = (n) => {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
    if (Math.abs(v) >= 1000) return `৳${(v / 1000).toFixed(1)}k`;
    return `৳${v.toLocaleString()}`;
  };
  return (
    <ScaleBarChart
      values={values}
      formatValue={compact}
      emptyMessage="No income or costing records for this year."
      colorFor={(v) => (v > 0 ? "var(--color-success)" : v < 0 ? "var(--color-error)" : "var(--color-border)")}
    />
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [routeEntries, setRouteEntries] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const [loansRes, payRes, invRes, depRes, expRes, routeRes, salRes] = await Promise.all([
          fetch("/api/data?collection=loans", { cache: "no-store" }),
          fetch("/api/data?collection=payments", { cache: "no-store" }),
          fetch("/api/data?collection=investments", { cache: "no-store" }),
          fetch("/api/data?collection=deposits", { cache: "no-store" }),
          fetch("/api/data?collection=expenseEntries", { cache: "no-store" }),
          fetch("/api/data?collection=routeEntries", { cache: "no-store" }),
          fetch("/api/data?collection=salaryPayments", { cache: "no-store" }),
        ]);
        if (!loansRes.ok || !payRes.ok || !invRes.ok || !depRes.ok || !expRes.ok || !routeRes.ok || !salRes.ok) {
          throw new Error("Failed to fetch data");
        }
        setLoans((await loansRes.json()).data || []);
        setPayments((await payRes.json()).data || []);
        setInvestments((await invRes.json()).data || []);
        setDeposits((await depRes.json()).data || []);
        setExpenseEntries((await expRes.json()).data || []);
        setRouteEntries((await routeRes.json()).data || []);
        setSalaryPayments((await salRes.json()).data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const dashboard = useMemo(
    () =>
      computeDashboard({
        loans,
        payments,
        investments,
        deposits,
        expenseEntries,
        routeEntries,
        salaryPayments,
      }),
    [loans, payments, investments, deposits, expenseEntries, routeEntries, salaryPayments]
  );

  const enrichedLoans = useMemo(
    () =>
      loans.map((l) => ({
        ...l,
        totalPayable: loanTotalPayable(l),
        paidAmount: loanPaidAmount(l.id, payments),
        autoStatus: loanAutoStatus(l, payments),
      })),
    [loans, payments]
  );
  const loanSummary = useMemo(() => computeLoanSummary(enrichedLoans, payments), [enrichedLoans, payments]);

  const yearOptions = useMemo(() => {
    const set = new Set([...(dashboard.years || []), String(new Date().getFullYear())]);
    if (selectedYear) set.add(selectedYear);
    return [...set].sort().map((y) => ({ value: y, label: y }));
  }, [dashboard, selectedYear]);
  const effectiveYear = yearOptions.some((o) => o.value === selectedYear)
    ? selectedYear
    : String(new Date().getFullYear());

  const counts = useMemo(() => yearlyProfitCounts(dashboard.profitByMonth, effectiveYear), [dashboard, effectiveYear]);

  const curMonth = dashboard.months.current;
  const prevMonth = dashboard.months.previous;

  // This-month costing split (office + route + salary) — all real records.
  const expenseSplit = useMemo(() => {
    const isApproved = (e) => {
      const s = e?.approvalStatus || e?.status;
      return !s || s === "Approved";
    };
    const monthOf = (e) => e?.month || String(e?.date || "").slice(0, 7);
    const office = (expenseEntries || [])
      .filter((e) => isApproved(e) && monthOf(e) === curMonth)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const route = (routeEntries || [])
      .filter((e) => isApproved(e) && monthOf(e) === curMonth)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const salary = (salaryPayments || [])
      .filter((p) => String(p?.date || "").slice(0, 7) === curMonth)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { office, route, salary };
  }, [expenseEntries, routeEntries, salaryPayments, curMonth]);

  const lastProfit = dashboard.totals.lastMonthProfit;
  const isProfit = lastProfit >= 0;

  const summaryBoxes = useMemo(
    () => [
      {
        key: "last-profit",
        title: "Last Month Profit / Loss",
        caption: monthLabel(prevMonth),
        variant: isProfit ? "success" : "error",
        icon: isProfit ? <TrendingUp className="h-5 w-5" aria-hidden="true" /> : <TrendingDown className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Status", value: isProfit ? "Profit" : "Loss", tone: isProfit ? "success" : "error" },
          { label: "Amount", value: formatMoney(lastProfit), tone: isProfit ? "success" : "error" },
        ],
      },
      {
        key: "yearly-insights",
        title: "Yearly Insights",
        caption: `Year ${effectiveYear}`,
        variant: "info",
        icon: <CalendarClock className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Profit Months", value: counts.profitMonths.toLocaleString(), tone: "success" },
          { label: "Loss Months", value: counts.lossMonths.toLocaleString(), tone: counts.lossMonths > 0 ? "error" : "muted" },
        ],
      },
      {
        key: "month-expense",
        title: "This Month's Total Expense",
        caption: monthLabel(curMonth),
        variant: "warning",
        icon: <Wallet className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Total Expense", value: formatMoney(dashboard.totals.thisMonthExpense) },
          { label: "Office · Route · Salary", value: `${formatMoney(expenseSplit.office)} · ${formatMoney(expenseSplit.route)} · ${formatMoney(expenseSplit.salary)}`, tone: "muted" },
        ],
      },
      {
        key: "investment",
        title: "Investment",
        caption: null,
        variant: "default",
        icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Lifetime Investment", value: formatMoney(dashboard.totals.lifetimeInvestment) },
          { label: "Current Month Investment", value: formatMoney(dashboard.totals.currentMonthInvestment) },
        ],
      },
      {
        key: "deposit",
        title: "Company Deposit",
        caption: null,
        variant: "success",
        icon: <Building2 className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Lifetime Deposit", value: formatMoney(dashboard.totals.lifetimeDeposit) },
          { label: "Current Month Deposit", value: formatMoney(dashboard.totals.currentMonthDeposit) },
        ],
      },
      {
        key: "commission",
        title: "Commission",
        caption: null,
        variant: "info",
        icon: <HandCoins className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Lifetime Commission", value: formatMoney(dashboard.totals.lifetimeCommission) },
          { label: `Last Month (${monthLabel(prevMonth)})`, value: formatMoney(dashboard.totals.lastMonthCommission) },
        ],
      },
      {
        key: "active-loans",
        title: "Active Loans",
        caption: null,
        variant: "default",
        icon: <Landmark className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Currently Active Loans", value: loanSummary.active.count.toLocaleString() },
          { label: "Active Loan Amount", value: formatLoanMoney(loanSummary.active.amount) },
        ],
      },
      {
        key: "month-loan-payment",
        title: "Current Month Loan Payment",
        caption: monthLabel(curMonth),
        variant: "info",
        icon: <CreditCard className="h-5 w-5" aria-hidden="true" />,
        rows: [
          { label: "Total Due", value: formatLoanMoney(loanSummary.installments.totalAmount) },
          { label: "Paid / Remaining", value: `${formatLoanMoney(loanSummary.installments.paidAmount)} / ${formatLoanMoney(loanSummary.installments.dueAmount)}`, tone: loanSummary.installments.dueAmount > 0 ? "error" : "success" },
        ],
      },
    ],
    [dashboard, counts, curMonth, prevMonth, effectiveYear, isProfit, lastProfit, expenseSplit, loanSummary]
  );

  const chartSeries = useMemo(() => {
    const codes = yearMonthCodes(effectiveYear);
    const compact = { profit: [], commission: [], costing: [] };
    codes.forEach((m) => {
      const label = shortMonthLabel(m);
      compact.profit.push({ key: m, label, value: Number(dashboard.profitByMonth[m] || 0) });
      compact.commission.push({ key: m, label, value: Number(dashboard.commissionByMonth[m] || 0) });
      compact.costing.push({ key: m, label, value: Number(dashboard.costingByMonth[m] || 0) });
    });
    return compact;
  }, [dashboard, effectiveYear]);

  const activities = useMemo(() => {
    return loans.map((loan, i) => ({
      id: loan.id || i,
      title: `Loan ${loan.id}`,
      description: `${loan.organizationName} — ৳${(loan.amount || 0).toLocaleString()}`,
      timestamp: "Recent",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    }));
  }, [loans]);

  const totalPages = Math.max(1, Math.ceil(activities.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedActivities = activities.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  if (loading) {
    return (
      <PageContainer title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8" aria-label="Loading summary boxes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[180px] bg-[var(--color-hover)] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-[300px] bg-[var(--color-hover)] rounded-lg animate-pulse mb-8" aria-label="Loading chart" />
        <div className="space-y-3" aria-label="Loading activities">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-[var(--color-hover)] rounded-lg animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Dashboard">
        <ErrorState title="Failed to load dashboard" description="Unable to load dashboard data." onRetry={() => window.location.reload()} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard">
      <section aria-label="Summary boxes">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {summaryBoxes.map((box) => (
            <SummaryBox
              key={box.key}
              title={box.title}
              caption={box.caption}
              icon={box.icon}
              variant={box.variant}
              rows={box.rows}
            />
          ))}
        </div>
      </section>

      <section aria-label="Yearly charts" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Yearly Charts</h2>
          <FormField label="Year" id="dashboard-year" className="w-full sm:w-40">
            <Select
              value={effectiveYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={yearOptions}
              placeholder="Select year"
              id="dashboard-year"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard
            title="Yearly Profit & Loss Chart"
            actions={<Badge variant={counts.profitMonths >= counts.lossMonths ? "active" : "cancelled"}>{effectiveYear} · {counts.profitMonths} profit / {counts.lossMonths} loss</Badge>}
            className="xl:col-span-2"
          >
            <ProfitLossChart values={chartSeries.profit} />
            <p className="mt-3 text-xs text-[var(--color-ink-3)]">
              Month-wise profit (income from completed loan payments minus office + route + salary costing). Green = profit, red = loss.
            </p>
          </ChartCard>
          <ChartCard
            title="Yearly Commission Chart"
            actions={<Badge variant="info">{effectiveYear}</Badge>}
          >
            <ScaleBarChart
              values={chartSeries.commission}
              formatValue={(n) => formatMoney(n)}
              emptyMessage="No commission records for this year."
              colorFor={() => "var(--color-primary)"}
            />
            <p className="mt-3 text-xs text-[var(--color-ink-3)]">
              Month-wise commission (interest portion of completed loan payments).
            </p>
          </ChartCard>
          <ChartCard
            title="Yearly Costing Chart"
            actions={<Badge variant="info">{effectiveYear}</Badge>}
          >
            <ScaleBarChart
              values={chartSeries.costing}
              formatValue={(n) => formatMoney(n)}
              emptyMessage="No costing records for this year."
              colorFor={() => "#F59E0B"}
            />
            <p className="mt-3 text-xs text-[var(--color-ink-3)]">
              Month-wise total costing (approved office + route expenses plus salary paid).
            </p>
          </ChartCard>
        </div>
      </section>

      <section aria-label="Recent Activity">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">Recent Activity</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <ActivityList items={paginatedActivities} />
          {activities.length > itemsPerPage && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={activities.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </Card>
      </section>
    </PageContainer>
  );
}
