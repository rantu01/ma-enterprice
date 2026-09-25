"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import ActivityList from "@/components/dashboard/ActivityList";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";

function LoanActivityChart({ data }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const approved = data.map((d) => d.approved || 0);
  const disbursed = data.map((d) => d.disbursed || 0);
  const maxVal = Math.max(...approved, 1);

  return (
    <div className="w-full h-[300px] flex items-end justify-between gap-2 px-4">
      {months.map((month, i) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[0.6875rem] text-[var(--color-ink-3)]">{approved[i]}</span>
          <div className="w-full bg-[var(--color-primary-subtle)] rounded-t-md" style={{ height: `${(approved[i] / maxVal) * 200}px` }} aria-hidden="true" />
          <span className="text-[0.6875rem] text-[var(--color-ink-3)]">{month}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const [loansRes, employeesRes, investmentsRes, depositsRes] = await Promise.all([
          fetch("/api/data?collection=loans"),
          fetch("/api/data?collection=employees"),
          fetch("/api/data?collection=investments"),
          fetch("/api/data?collection=deposits"),
        ]);

        if (!loansRes.ok || !employeesRes.ok || !investmentsRes.ok || !depositsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const loansData = await loansRes.json();
        const employeesData = await employeesRes.json();
        const investmentsData = await investmentsRes.json();
        const depositsData = await depositsRes.json();

        setLoans(loansData.data || []);
        setEmployees(employeesData.data || []);
        setInvestments(investmentsData.data || []);
        setDeposits(depositsData.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const kpis = useMemo(() => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter((l) => l.status === "active").length;
    const outstanding = loans.filter((l) => l.status === "active").reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalInvestment = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalDeposit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    return [
      { title: "Total Loans", value: totalLoans.toLocaleString(), trend: 12.5, trendLabel: "vs last month", variant: "default", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
      { title: "Active Loans", value: activeLoans.toLocaleString(), trend: 8.2, trendLabel: "vs last month", variant: "success", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
      { title: "Outstanding Amount", value: `$${(outstanding / 1000000).toFixed(1)}M`, trend: -3.1, trendLabel: "vs last month", variant: "warning", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
      { title: "Total Employees", value: employees.length.toLocaleString(), trend: 5.7, trendLabel: "vs last month", variant: "info", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    ];
  }, [loans, employees, investments, deposits]);

  const activities = useMemo(() => {
    return loans.map((loan, i) => ({
      id: loan.id || i,
      title: `Loan ${loan.id}`,
      description: `${loan.organizationName} — $${(loan.amount || 0).toLocaleString()}`,
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
  const paginatedActivities = activities.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const chartData = useMemo(() => {
    return [
      { month: "Jan", approved: 42, disbursed: 38 },
      { month: "Feb", approved: 55, disbursed: 48 },
      { month: "Mar", approved: 48, disbursed: 45 },
      { month: "Apr", approved: 62, disbursed: 55 },
      { month: "May", approved: 71, disbursed: 60 },
      { month: "Jun", approved: 65, disbursed: 58 },
      { month: "Jul", approved: 78, disbursed: 70 },
      { month: "Aug", approved: 82, disbursed: 75 },
      { month: "Sep", approved: 75, disbursed: 68 },
      { month: "Oct", approved: 88, disbursed: 80 },
      { month: "Nov", approved: 92, disbursed: 85 },
      { month: "Dec", approved: 95, disbursed: 88 },
    ];
  }, []);

  if (loading) {
    return (
      <PageContainer title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="Loading KPI cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] bg-[var(--color-hover)] rounded-lg animate-pulse" />
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
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <StatCard key={kpi.title} {...kpi} />
          ))}
        </div>
      </section>

      <section aria-label="Loan Activity Chart" className="mb-8">
        <ChartCard title="Loan Activity" actions={<Badge variant="info">Monthly</Badge>}>
          <LoanActivityChart data={chartData} />
        </ChartCard>
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