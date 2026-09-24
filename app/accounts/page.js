"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

  const totalInvestment = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalDeposit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

  const statCards = [
    { title: "Total Investment", value: `$${totalInvestment.toLocaleString()}`, trend: "+18%", trendLabel: "vs last quarter", variant: "default", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { title: "Company Deposit", value: `$${totalDeposit.toLocaleString()}`, trend: "+5%", trendLabel: "vs last quarter", variant: "success", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { title: "Net Worth", value: `$${(totalInvestment + totalDeposit).toLocaleString()}`, trend: "+12%", trendLabel: "vs last quarter", variant: "warning", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  const transactions = investments.map((inv) => ({
    id: inv.id,
    type: "investment",
    description: inv.name,
    amount: `+$${(inv.amount || 0).toLocaleString()}`,
    date: inv.date,
    status: inv.status,
  })).concat(deposits.map((dep) => ({
    id: dep.id,
    type: "deposit",
    description: dep.description || dep.type,
    amount: `+$${(dep.amount || 0).toLocaleString()}`,
    date: dep.date,
    status: dep.status,
  })));

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
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">Recent Transactions</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          {loading ? (
            <Skeleton count={5} height={48} className="w-full" />
          ) : error ? (
            <ErrorState title="Failed to load transactions" description="Unable to load transaction history." onRetry={() => window.location.reload()} />
          ) : transactions.length === 0 ? (
            <EmptyState icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} title="No transactions" description="No recent transactions found." action={<Button variant="outline" size="sm">Add Transaction</Button>} />
          ) : (
            <table className="w-full" role="table">
              <thead>
                <tr className="bg-[var(--color-base)] border-b border-[var(--color-line)]">
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">Type</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">Description</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">Amount</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">Date</th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const typeInfo = transactionTypeMap[tx.type] || { variant: "info", label: tx.type };
                  return (
                    <tr key={tx.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-hover)] transition-colors">
                      <td className="px-4 py-3"><Badge variant={typeInfo.variant}>{typeInfo.label}</Badge></td>
                      <td className="px-4 py-3 text-[13px] text-[var(--color-ink)] font-medium">{tx.description}</td>
                      <td className={`px-4 py-3 text-[13px] font-medium ${tx.amount.startsWith("+") ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>{tx.amount}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--color-ink-3)]">{tx.date}</td>
                      <td className="px-4 py-3"><Badge variant="active">{tx.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </PageContainer>
  );
}