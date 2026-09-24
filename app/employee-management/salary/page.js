"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

const statusVariantMap = {
  Paid: "paid",
  Pending: "pending",
  Unpaid: "unpaid",
  Processing: "processing",
  Overdue: "overdue",
};

const employeeOptions = [
  { value: "", label: "Select Employee" },
];

const salaryPeriodOptions = [
  { value: "january", label: "January 2025" },
  { value: "february", label: "February 2025" },
  { value: "march", label: "March 2025" },
  { value: "april", label: "April 2025" },
];

export default function SalaryDistributionPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [employees, setEmployees] = useState([]);
  const [distributionData, setDistributionData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, salRes] = await Promise.all([
          fetch("/api/data?collection=employees"),
          fetch("/api/data?collection=salaries"),
        ]);
        if (!empRes.ok || !salRes.ok) throw new Error("Failed");
        const empData = await empRes.json();
        const salData = await salRes.json();
        setEmployees(empData.data || []);
        setDistributionData(salData.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const employeeSelectOptions = [
    { value: "", label: "Select Employee" },
    ...employees.map((e) => ({ value: e.name, label: e.name })),
  ];

  const handleDistribute = () => {
    if (!selectedEmployee || !selectedPeriod || !amount || !paymentStatus) {
      addToast({ type: "warning", title: "Missing Information", message: "Please fill in all fields to distribute salary." });
      return;
    }
    const newEntry = {
      id: Date.now(),
      employee: selectedEmployee,
      email: employees.find((e) => e.name === selectedEmployee)?.email || "",
      period: selectedPeriod,
      amount: `$${parseFloat(amount).toLocaleString()}`,
      status: paymentStatus,
      date: new Date().toISOString().split("T")[0],
    };
    setDistributionData([newEntry, ...distributionData]);
    addToast({ type: "success", title: "Salary Distributed", message: `Salary of $${amount} distributed successfully.` });
    setSelectedEmployee("");
    setSelectedPeriod("");
    setAmount("");
    setPaymentStatus("");
  };

  const columns = [
    { key: "employee", label: "Employee", accessor: "employee", sortable: true, minWidth: "180px", render: (val, row) => (
      <div>
        <span className="font-medium text-[var(--color-ink)]">{val}</span>
        <p className="text-[0.75rem] text-[var(--color-ink-3)]">{row.email}</p>
      </div>
    )},
    { key: "period", label: "Salary Period", accessor: "period", sortable: true, minWidth: "160px" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px" },
    { key: "status", label: "Payment Status", accessor: "status", sortable: true, minWidth: "130px", render: (val) => (
      <Badge variant={statusVariantMap[val] || "info"}>{val}</Badge>
    )},
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px" },
  ];

  return (
    <PageContainer title="Salary Distribution">
      <section aria-label="Distribute salary">
        <Card className="mb-6">
          <h2 className="text-[18px] font-semibold text-[var(--color-ink)] mb-4">Distribute Salary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select options={employeeSelectOptions} value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} placeholder="Select Employee" className="w-full" aria-label="Select employee" />
            <Select options={salaryPeriodOptions} value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} placeholder="Select Period" className="w-full" aria-label="Select salary period" />
            <Input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="text" aria-label="Salary amount" />
            <Select options={[{ value: "", label: "Payment Status" }, { value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }, { value: "Processing", label: "Processing" }]} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="Payment Status" className="w-full" aria-label="Payment status" />
            <Button onClick={handleDistribute}>Distribute</Button>
          </div>
        </Card>
      </section>

      <section aria-label="Distribution history">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">Distribution History</h2>
          </div>
          {loading ? (
            <Skeleton count={5} height={48} className="w-full" />
          ) : error ? (
            <ErrorState title="Failed to load distribution history" description="Unable to load salary distribution records. Please try again." onRetry={() => window.location.reload()} />
          ) : distributionData.length === 0 ? (
            <EmptyState icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} title="No distribution records" description="No salary distributions have been recorded yet." action={<Button variant="outline" size="sm">Make a Distribution</Button>} />
          ) : (
            <table className="w-full" role="table">
              <thead>
                <tr className="bg-[var(--color-base)] border-b border-[var(--color-line)]">
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributionData.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-hover)] transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-[13px] text-[var(--color-ink)]">
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </PageContainer>
  );
}