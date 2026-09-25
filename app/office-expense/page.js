"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import ActivityList from "@/components/dashboard/ActivityList";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import {
  DollarSign,
  FolderKanban,
  TrendingUp,
  Clock,
  FileText,
  Plus,
} from "lucide-react";

export default function OfficeExpensePage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=expenses");
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.data || []);
        }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, []);

  const kpiData = [
    {
      title: "Monthly Total",
      value: `$${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}`,
      trend: 12.5,
      trendLabel: "vs last month",
      icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
      variant: "default",
    },
    {
      title: "Categories",
      value: expenses.length.toString(),
      trend: 2,
      trendLabel: "new this month",
      icon: <FolderKanban className="h-5 w-5" aria-hidden="true" />,
      variant: "success",
    },
    {
      title: "Average per Category",
      value: `$${expenses.length > 0 ? Math.round(expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / expenses.length).toLocaleString() : "0"}`,
      trend: -3.2,
      trendLabel: "vs last month",
      icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
      variant: "warning",
    },
    {
      title: "Pending Approvals",
      value: expenses.filter((e) => e.status === "Pending").length.toString(),
      trend: undefined,
      icon: <Clock className="h-5 w-5" aria-hidden="true" />,
      variant: "info",
    },
  ];

  const recentExpenses = expenses.map((exp) => ({
    id: exp.id,
    title: exp.category,
    description: exp.notes || "",
    timestamp: exp.month,
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
  }));

  const totalPages = Math.max(1, Math.ceil(expenses.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedExpenses = expenses.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const summaryColumns = [
    { key: "category", label: "Category", accessor: "category", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: "status", label: "Status", accessor: "status", render: (val) => <Badge variant={val === "Approved" ? "active" : val === "Pending" ? "pending" : "processing"}>{val}</Badge> },
  ];

  return (
    <PageContainer title="Office Expense" breadcrumb={<nav aria-label="Breadcrumb"><span>Office Expense</span></nav>}>
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <StatCard key={kpi.title} {...kpi} />
          ))}
        </div>
      </section>

      <section aria-label="Expense analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Expense Trend" actions={<Button variant="ghost" size="sm">Export</Button>}>
          <div className="w-full h-[300px] flex items-center justify-center bg-[var(--color-base)] rounded-md" role="img" aria-label="Expense trend chart visualization">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-end gap-2">
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
                  <div key={i} className="w-6 bg-[var(--color-primary)] rounded-t transition-all hover:bg-[var(--color-primary-hover)]" style={{ height: `${h}%` }} aria-hidden="true" />
                ))}
              </div>
              <p className="text-[0.75rem] text-[var(--color-ink-3)]">Monthly Expense Data</p>
            </div>
          </div>
        </ChartCard>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">Recent Expenses</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <ActivityList items={recentExpenses} />
        </Card>
      </section>

      <section aria-label="Expense summary" className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">Expense Summary</h3>
          </div>
          <DataTable columns={summaryColumns} data={paginatedExpenses} emptyMessage="No expenses found." pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: expenses.length, itemsPerPage }} />
        </Card>
      </section>
    </PageContainer>
  );
}