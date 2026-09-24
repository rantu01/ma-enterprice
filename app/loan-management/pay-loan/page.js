"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

const paymentMethodMap = {
  bank_transfer: "Bank Transfer",
  wire_transfer: "Wire Transfer",
  check: "Check",
  credit_card: "Credit Card",
};

export default function PayLoanPage() {
  const { addToast } = useToast();
  const [selectedLoan, setSelectedLoan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);

  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "wire_transfer", label: "Wire Transfer" },
    { value: "check", label: "Check" },
    { value: "credit_card", label: "Credit Card" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [loanRes, payRes] = await Promise.all([
          fetch("/api/data?collection=loans"),
          fetch("/api/data?collection=payments"),
        ]);
        if (loanRes.ok) {
          const data = await loanRes.json();
          setLoans(data.data || []);
        }
        if (payRes.ok) {
          const data = await payRes.json();
          setPayments(data.data || []);
        }
      } catch {}
    }
    fetchData();
  }, []);

  const loanOptions = [
    { value: "", label: "Select a loan to pay" },
    ...loans.map((l) => ({ value: l.id, label: `${l.id} — ${l.organizationName} ($${(l.amount || 0).toLocaleString()})` })),
  ];

  const paymentHistoryColumns = [
    { key: "id", label: "Payment ID", accessor: "id", sortable: true },
    { key: "loanId", label: "Loan ID", accessor: "loanId", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: "method", label: "Method", accessor: "method", sortable: true, render: (val) => <Badge variant="info">{paymentMethodMap[val] || val}</Badge> },
    { key: "date", label: "Date", accessor: "date", sortable: true },
    { key: "status", label: "Status", accessor: "status", sortable: true, render: (val) => <Badge variant={val === "completed" ? "completed" : val === "pending" ? "pending" : "processing"}>{val}</Badge> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(false);
    setFormSuccess(false);
    try {
      const res = await fetch("/api/data?collection=payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: selectedLoan,
          loanOrganization: loans.find((l) => l.id === selectedLoan)?.organizationName || "",
          amount: parseFloat(e.target["pay-amount"].value) || 0,
          method: e.target["pay-method"].value,
          date: e.target["pay-date"].value,
          status: "pending",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayments((prev) => [data.data, ...prev]);
        setFormSuccess(true);
        addToast({ type: "success", title: "Payment Submitted", message: "Your payment has been processed." });
      } else {
        setFormError(true);
      }
    } catch {
      setFormError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formSuccess) {
    return (
      <PageContainer title="Pay Loan">
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-success)]" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          title="Payment submitted successfully"
          description="Your payment has been processed and will be reflected in the loan account shortly."
          action={<Button variant="primary" onClick={() => setFormSuccess(false)}>Make Another Payment</Button>}
        />
      </PageContainer>
    );
  }

  if (formError) {
    return (
      <PageContainer title="Pay Loan">
        <ErrorState
          title="Payment failed"
          description="Something went wrong while processing your payment. Please try again."
          onRetry={() => setFormError(false)}
        />
      </PageContainer>
    );
  }

  const outstandingAmount = selectedLoan ? loans.find((l) => l.id === selectedLoan) : null;

  return (
    <PageContainer
      title="Pay Loan"
      breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Pay Loan</span></>}
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <FormSection title="Payment Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Select Loan" required id="pay-loan">
                <Select
                  options={loanOptions}
                  value={selectedLoan}
                  onChange={(e) => setSelectedLoan(e.target.value)}
                  placeholder="Select a loan to pay"
                  required
                  id="pay-loan"
                />
              </FormField>
              <FormField label="Outstanding Amount" id="pay-outstanding">
                <Input
                  id="pay-outstanding"
                  value={outstandingAmount ? `$${(outstandingAmount.amount || 0).toLocaleString()}` : ""}
                  placeholder="Select a loan to view outstanding amount"
                  disabled
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Payment Amount ($)" required id="pay-amount">
                <Input id="pay-amount" type="number" placeholder="0.00" required min="0" />
              </FormField>
              <FormField label="Payment Date" required id="pay-date">
                <Input id="pay-date" type="date" required />
              </FormField>
            </div>
            <FormField label="Payment Method" required id="pay-method">
              <Select options={paymentMethods} placeholder="Select payment method" required id="pay-method" />
            </FormField>
          </FormSection>
        </Card>

        <nav aria-label="Form actions" className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => { setFormSuccess(false); setFormError(false); }}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Processing..." : "Submit Payment"}
          </Button>
        </nav>
      </form>

      <section aria-label="Payment History" className="mt-8">
        <Card>
          <DataTable
            columns={paymentHistoryColumns}
            data={payments}
            emptyMessage="No payment history found."
            pagination={{ currentPage: 1, totalPages: 1, onPageChange: () => {}, totalItems: payments.length, itemsPerPage: 5, showingText: `Showing ${payments.length} payments` }}
          />
        </Card>
      </section>
    </PageContainer>
  );
}