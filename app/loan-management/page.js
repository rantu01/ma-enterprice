"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";

const statusVariantMap = {
  active: "active",
  pending: "pending",
  overdue: "overdue",
  paid: "paid",
  processing: "processing",
};

export default function LoanManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loans, setLoans] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=loans");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setLoans(data.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredLoans = useMemo(() => {
    if (filterStatus === "all") return loans;
    return loans.filter((l) => l.status === filterStatus);
  }, [loans, filterStatus]);

  const kpis = useMemo(() => {
    const totalApplications = loans.length;
    const approved = loans.filter((l) => l.status === "active").length;
    const pendingReview = loans.filter((l) => l.status === "pending").length;
    const disbursedThisMonth = loans.filter((l) => l.status === "active").reduce((sum, l) => sum + (l.amount || 0), 0);

    return [
      { title: "Total Applications", value: totalApplications.toLocaleString(), trend: 12.5, trendLabel: "vs last month", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, variant: "default" },
      { title: "Approved", value: approved.toLocaleString(), trend: 8.2, trendLabel: "vs last month", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, variant: "success" },
      { title: "Pending Review", value: pendingReview.toLocaleString(), trend: -2.4, trendLabel: "vs last month", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, variant: "warning" },
      { title: "Disbursed This Month", value: `$${(disbursedThisMonth / 1000000).toFixed(1)}M`, trend: 15.3, trendLabel: "vs last month", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, variant: "info" },
    ];
  }, [loans]);

  const loanColumns = [
    { key: "id", label: "Loan ID", accessor: "id", sortable: true },
    { key: "organizationName", label: "Organization", accessor: "organizationName", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: "status", label: "Status", accessor: "status", sortable: true, render: (val) => {
      const variantMap = { active: "active", pending: "pending", overdue: "overdue", paid: "paid", processing: "processing" };
      return <Badge variant={variantMap[val] || "info"}>{val}</Badge>;
    }},
    { key: "date", label: "Applied Date", accessor: "date", sortable: true },
  ];

  const handleFilterChange = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <PageContainer
      title="Loan Management"
      breadcrumb={<span>Loan Management</span>}
      actions={<Button variant="primary" size="sm">+ New Application</Button>}
    >
      <section aria-label="Key Metrics" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><Skeleton height={96} /></Card>
            ))
          ) : error ? (
            <ErrorState title="Failed to load KPIs" description="Unable to load loan statistics." onRetry={() => window.location.reload()} />
          ) : (
            kpis.map((kpi) => <StatCard key={kpi.title} {...kpi} />)
          )}
        </div>
      </section>

      <section aria-label="Recent Loans">
        <Card>
          <DataTable
            columns={loanColumns}
            data={filteredLoans}
            toolbar={[
              <Select key="filter" options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "overdue", label: "Overdue" }]} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); handleFilterChange(); }} placeholder="Filter by status" />,
            ]}
            pagination={{ currentPage: 1, totalPages: 1, onPageChange: () => {}, totalItems: filteredLoans.length, itemsPerPage: filteredLoans.length, showingText: `Showing ${filteredLoans.length} loans` }}
            emptyMessage="No loan applications found."
          />
        </Card>
      </section>
    </PageContainer>
  );
}