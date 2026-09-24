"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/contexts/ToastContext";
import {
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  Route,
  Calendar,
} from "lucide-react";

const reports = [
  {
    id: "loan",
    title: "Loan Report",
    description: "Comprehensive overview of all loan transactions, approvals, and repayments across the organization.",
    icon: <FileText className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "employee",
    title: "Employee Report",
    description: "Detailed employee data including headcount, department breakdown, and staffing metrics.",
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "salary",
    title: "Salary Report",
    description: "Salary distribution, payroll summary, and compensation analysis for all employees.",
    icon: <CreditCard className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "investment",
    title: "Investment Report",
    description: "Investment portfolio performance, returns, and asset allocation overview.",
    icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Detailed breakdown of office expenses by category, department, and time period.",
    icon: <Receipt className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "route-cost",
    title: "Route Cost Report",
    description: "Route cost analysis, vehicle expenses, and transportation efficiency metrics.",
    icon: <Route className="h-6 w-6" aria-hidden="true" />,
  },
];

const reportIcons = {
  loan: <FileText className="h-6 w-6" aria-hidden="true" />,
  employee: <Users className="h-6 w-6" aria-hidden="true" />,
  salary: <CreditCard className="h-6 w-6" aria-hidden="true" />,
  investment: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
  expense: <Receipt className="h-6 w-6" aria-hidden="true" />,
  "route-cost": <Route className="h-6 w-6" aria-hidden="true" />,
};

export default function ReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRanges, setDateRanges] = useState(
    Object.fromEntries(reports.map((r) => [r.id, { start: "", end: "" }]))
  );

  const handleGenerate = (reportId) => {
    setLoading(true);
    addToast({ type: "success", title: "Report Generated", message: `${reports.find((r) => r.id === reportId)?.title} has been generated.` });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <PageContainer title="Reports" breadcrumb={<nav aria-label="Breadcrumb"><span>Reports</span></nav>}>
      <section aria-label="Report center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} hover className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-[48px] h-[48px] rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" aria-hidden="true">
                  {reportIcons[report.id]}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">{report.title}</h3>
                  <p className="text-[0.75rem] text-[var(--color-ink-3)] uppercase tracking-[0.05em]">{report.id.replace("-", " ")} Report</p>
                </div>
              </div>
              <p className="text-[0.875rem] text-[var(--color-ink-2)] mb-4 flex-1">{report.description}</p>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`${report.id}-start`} className="text-[0.75rem] font-semibold text-[var(--color-ink)] leading-[1.4]">
                      From
                    </label>
                    <Input type="date" placeholder="Start" className="h-[36px] text-[0.8125rem]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`${report.id}-end`} className="text-[0.75rem] font-semibold text-[var(--color-ink)] leading-[1.4]">
                      To
                    </label>
                    <Input type="date" placeholder="End" className="h-[36px] text-[0.8125rem]" />
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerate(report.id)}
                  loading={loading}
                  className="w-full"
                  aria-label={`Generate ${report.title}`}
                >
                  <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                  Generate Report
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}