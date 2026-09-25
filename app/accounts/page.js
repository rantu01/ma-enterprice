"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

const transactionTypeMap = {
  investment: { variant: "info", label: "Investment" },
  deposit: { variant: "success", label: "Deposit" },
  withdrawal: { variant: "warning", label: "Withdrawal" },
  profit: { variant: "active", label: "Profit" },
};

export default function AccountsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, depRes] = await Promise.all([
          fetch("/api/data?collection=investments"),
          fetch("/api/data?collection=deposits"),
        ]);
        if (!invRes.ok || !depRes.ok) throw new Error("Failed");
        setInvestments((await invRes.json()).data || []);
        setDeposits((await depRes.json()).data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalInvestment = investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalDeposit = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const statCards = [
    { title: "Total Investment", value: `$${totalInvestment.toLocaleString()}`, trend: "+18%", trendLabel: "vs last quarter", variant: "default", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { title: "Company Deposit", value: `$${totalDeposit.toLocaleString()}`, trend: "+5%", trendLabel: "vs last quarter", variant: "success", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { title: "Net Worth", value: `$${(totalInvestment + totalDeposit).toLocaleString()}`, trend: "+12%", trendLabel: "vs last quarter", variant: "warning", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  const transactions = investments.map((inv) => ({
    id: inv.id,
    type: "investment",
    description: inv.name,
    amount: `+$${(Number(inv.amount) || 0).toLocaleString()}`,
    date: inv.date,
    status: inv.status,
  })).concat(deposits.map((dep) => ({
    id: dep.id,
    type: "deposit",
    description: dep.description || dep.type,
    amount: `+$${(Number(dep.amount) || 0).toLocaleString()}`,
    date: dep.date,
    status: dep.status,
  })));

  const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTransactions = transactions.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const transactionColumns = [
    { key: "type", label: "Type", accessor: "type", sortable: true, render: (v) => { const info = transactionTypeMap[v] || { variant: "info", label: v }; return <Badge variant={info.variant}>{info.label}</Badge>; } },
    { key: "description", label: "Description", accessor: "description", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => <span className="text-[var(--color-success)] font-medium">{v}</span> },
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, render: (v) => <Badge variant="active">{v}</Badge> },
  ];

  return (
    <PageContainer title="Accounts">
      <section aria-label="Account overview metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Card key={i}><Skeleton height={96} /></Card>)
          ) : error ? (
            <ErrorState title="Failed to load accounts" description="Unable to load account data." onRetry={() => window.location.reload()} />
          ) : (
            statCards.map((stat) => <StatCard key={stat.title} {...stat} />)
          )}
        </div>
      </section>

      <section aria-label="Recent transactions">
        <Card padding="0">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">Recent Transactions</h2>
          </div>
          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div>
          ) : error ? (
            <div className="px-4 pb-4"><ErrorState title="Failed to load transactions" description="Unable to load transaction history." onRetry={() => window.location.reload()} /></div>
          ) : transactions.length === 0 ? (
            <div className="px-4 pb-4"><EmptyState icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} title="No transactions" description="No recent transactions found." action={<Button variant="outline" size="sm">Add Transaction</Button>} /></div>
          ) : (
            <DataTable
              columns={transactionColumns}
              data={paginatedTransactions}
              emptyMessage="No recent transactions found."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: transactions.length, itemsPerPage }}
            />
          )}
        </Card>
      </section>
    </PageContainer>
  );
}
