"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { CreditCard, Pencil, Trash2, CircleAlert } from "lucide-react";
import {
  LOAN_PAYMENT_METHODS as paymentMethods,
  paymentMethodLabel,
  loanTotalPayable,
  loanPaidAmount,
  loanDueAmount,
  isPeriodAlreadyPaid,
  periodLabel,
  formatMoney,
} from "@/lib/loan-utils";

const ITEMS_PER_PAGE = 8;

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
];

export default function PayLoanPage() {
  const { addToast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedLoan, setSelectedLoan] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [loanRes, payRes, orgRes] = await Promise.all([
          fetch("/api/data?collection=loans", { cache: "no-store" }),
          fetch("/api/data?collection=payments", { cache: "no-store" }),
          fetch("/api/data?collection=organizations", { cache: "no-store" }),
        ]);
        if (loanRes.ok) setLoans((await loanRes.json()).data || []);
        if (payRes.ok) setPayments((await payRes.json()).data || []);
        if (orgRes.ok) setOrganizations((await orgRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const orgOptions = useMemo(
    () => organizations.map((o) => ({ value: o.name, label: o.name })),
    [organizations]
  );

  const loansForOrg = useMemo(() => {
    if (!selectedOrg) return loans;
    return loans.filter((l) => l.organizationName === selectedOrg);
  }, [loans, selectedOrg]);

  const loanOptions = [
    { value: "", label: selectedOrg ? "Select a loan" : "Select an organization first" },
    ...loansForOrg.map((l) => ({
      value: l.id,
      label: `${l.organizationName || l.id} — ${formatMoney(loanTotalPayable(l))}${l.frequency ? ` (${l.frequency})` : ""}`,
    })),
  ];

  const activeLoan = useMemo(
    () => loans.find((l) => String(l.id) === String(selectedLoan)) || null,
    [loans, selectedLoan]
  );

  const outstanding = activeLoan ? loanDueAmount(activeLoan, payments) : 0;
  const paidSoFar = activeLoan ? loanPaidAmount(activeLoan.id, payments) : 0;
  const frequency = activeLoan?.frequency || "monthly";
  const installmentDue = Number(activeLoan?.installmentAmount) || 0;

  const periodPaid = useMemo(
    () =>
      activeLoan && paymentDate
        ? isPeriodAlreadyPaid(activeLoan.id, paymentDate, frequency, payments)
        : false,
    [activeLoan, paymentDate, frequency, payments]
  );

  const useInstallment = () => {
    if (installmentDue > 0) setPaymentAmount(String(installmentDue));
  };

  const resetForm = () => {
    setSelectedOrg("");
    setSelectedLoan("");
    setPaymentDate("");
    setPaymentAmount("");
    setPaymentMethod("");
  };

  const handleLoanSelect = (loanId) => {
    setSelectedLoan(loanId);
    const loan = loans.find((l) => String(l.id) === String(loanId));
    if (loan && Number(loan.installmentAmount) > 0) {
      setPaymentAmount(String(loan.installmentAmount));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) {
      addToast({ type: "warning", title: "Missing organization", message: "Please select an organization first." });
      return;
    }
    if (!selectedLoan || !activeLoan) {
      addToast({ type: "warning", title: "Missing loan", message: "Please select a loan first." });
      return;
    }
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      addToast({ type: "warning", title: "Invalid amount", message: "Payment amount must be greater than zero." });
      return;
    }
    if (periodPaid) {
      addToast({
        type: "warning",
        title: "Already paid",
        message: `The installment for ${periodLabel(paymentDate, frequency)} has already been paid.`,
      });
      return;
    }
    if (amount > outstanding) {
      addToast({ type: "warning", title: "Exceeds outstanding", message: `Amount exceeds outstanding balance of ${formatMoney(outstanding)}.` });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: selectedLoan,
          organizationName: activeLoan.organizationName || selectedOrg,
          loanOrganization: activeLoan.organizationName || selectedOrg,
          amount,
          method: paymentMethod,
          date: paymentDate,
          paymentDate,
          status: "completed",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newPayments = [data.data, ...payments];
      setPayments(newPayments);
      // Auto-update loan status / calculations
      const newPaid = paidSoFar + amount;
      const total = loanTotalPayable(activeLoan);
      const newDue = Math.max(0, Math.round((total - newPaid) * 100) / 100);
      const newStatus = newDue <= 0 ? "paid" : activeLoan.status === "paid" ? "paid" : "active";
      try {
        await fetch(`/api/data?id=${activeLoan.id}&collection=loans`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...activeLoan, status: newStatus }),
        });
      } catch {
        /* non-fatal */
      }
      setLoans((prev) => prev.map((l) => (String(l.id) === String(activeLoan.id) ? { ...l, status: newStatus } : l)));
      setCurrentPage(1);
      resetForm();
      addToast({
        type: "success",
        title: "Payment Recorded",
        message: newDue <= 0 ? "Loan fully paid. Status updated to Paid." : `Payment recorded. Remaining due: ${formatMoney(newDue)}.`,
      });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to submit payment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = payments;
    if (selectedOrg) list = list.filter((p) => (p.organizationName || p.loanOrganization) === selectedOrg);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) =>
      [p.loanId, p.loanOrganization, p.organizationName, p.method, p.status].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [payments, search, selectedOrg]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const refreshLoanStatus = async (loanId, nextPayments) => {
    const loan = loans.find((l) => String(l.id) === String(loanId));
    if (!loan) return;
    const paid = loanPaidAmount(loanId, nextPayments);
    const due = Math.max(0, loanTotalPayable(loan) - paid);
    const status = due <= 0 && loanTotalPayable(loan) > 0 ? "paid" : loan.status === "paid" && due > 0 ? "active" : loan.status;
    setLoans((prev) => prev.map((l) => (String(l.id) === String(loanId) ? { ...l, status } : l)));
    try {
      await fetch(`/api/data?id=${loanId}&collection=loans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...loan, status }),
      });
    } catch {
      /* non-fatal */
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=payments`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        const next = payments.map((x) => (x.id === editing.id ? { ...x, ...updated } : x));
        setPayments(next);
        await refreshLoanStatus(updated.loanId || editing.loanId, next);
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Payment Updated", message: "Payment and loan balance updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update payment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=payments`, { method: "DELETE" });
      if (res.ok) {
        const next = payments.filter((x) => x.id !== deleting.id);
        setPayments(next);
        await refreshLoanStatus(deleting.loanId, next);
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Payment Deleted", message: "Payment removed and loan balance updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete payment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const paymentHistoryColumns = [
    { key: "loanOrganization", label: "Organization", accessor: "loanOrganization", sortable: true, minWidth: "170px", render: (v, r) => r.organizationName || v || r.loanId || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "110px", render: (val) => formatMoney(val) },
    { key: "method", label: "Method", accessor: "method", sortable: true, minWidth: "130px", render: (val) => <Badge variant="info">{paymentMethodLabel(val)}</Badge> },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v, r) => r.paymentDate || v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px", render: (val) => <Badge variant={val === "completed" ? "completed" : val === "pending" ? "pending" : "processing"}>{val || "—"}</Badge> },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...row }); setShowEditModal(true); }}><Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(row); setShowDeleteModal(true); }}><Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Pay Loan" breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Pay Loan</span></>}>
      <section aria-label="Payment form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Make a Payment</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Select organization, then loan. Balance updates automatically.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Select Organization" required id="pay-org">
                <Select
                  options={[{ value: "", label: "Select organization" }, ...orgOptions]}
                  value={selectedOrg}
                  onChange={(e) => { setSelectedOrg(e.target.value); setSelectedLoan(""); }}
                  id="pay-org"
                />
              </FormField>
              <FormField label="Select Loan" required id="pay-loan">
                <Select options={loanOptions} value={selectedLoan} onChange={(e) => handleLoanSelect(e.target.value)} required id="pay-loan" />
              </FormField>
              <FormField label="Outstanding Amount" id="pay-outstanding">
                <Input id="pay-outstanding" value={activeLoan ? formatMoney(outstanding) : ""} placeholder="Select a loan first" disabled />
              </FormField>
              <FormField label="Payment Date" required id="pay-date">
                <Input id="pay-date" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </FormField>
              <FormField label="Payment Amount" required id="pay-amount">
                <Input id="pay-amount" type="number" placeholder="0.00" required min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              </FormField>
              <FormField label="Payment Method" required id="pay-method">
                <Select options={[{ value: "", label: "Select payment method" }, ...paymentMethods]} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required id="pay-method" />
              </FormField>
            </div>

            {activeLoan && (
              <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm" role="status" aria-live="polite">
                {frequency === "monthly" ? (
                  <p className="text-[var(--color-ink-2)]">
                    Installment for {paymentDate ? periodLabel(paymentDate, frequency) : "the selected month"}:{" "}
                    <strong className="text-[var(--color-ink)]">{formatMoney(installmentDue)}</strong>
                    {installmentDue > 0 && (
                      <button type="button" onClick={useInstallment} className="ml-2 underline text-[var(--color-primary)]">Use installment amount</button>
                    )}
                  </p>
                ) : (
                  <p className="text-[var(--color-ink-2)]">
                    Weekly installment: <strong className="text-[var(--color-ink)]">{formatMoney(installmentDue)}</strong>
                    {installmentDue > 0 && (
                      <button type="button" onClick={useInstallment} className="ml-2 underline text-[var(--color-primary)]">Use installment amount</button>
                    )}
                  </p>
                )}
                <p className="text-xs text-[var(--color-ink-3)] mt-1">
                  Total {formatMoney(loanTotalPayable(activeLoan))} · Paid {formatMoney(paidSoFar)} · Due {formatMoney(outstanding)}
                </p>
              </div>
            )}

            {periodPaid && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-3 py-2.5 text-sm text-[var(--color-warning)]" role="alert">
                <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <p>The installment for {periodLabel(paymentDate, frequency)} has already been paid for this loan.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-[var(--color-line)]">
              <Button variant="secondary" size="sm" type="button" onClick={resetForm}>Clear</Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting} disabled={periodPaid}>{isSubmitting ? "Processing..." : "Submit Payment"}</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Payment History" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Payment History</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search payments..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search payments" />
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={paymentHistoryColumns} data={paginated} emptyMessage="No payment history found."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Payment"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Amount" id="edit-pay-amount"><Input type="number" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Method" id="edit-pay-method"><Select options={paymentMethods} value={editing.method || ""} onChange={(e) => setEditing((p) => ({ ...p, method: e.target.value }))} /></FormField>
            <FormField label="Date" id="edit-pay-date"><Input type="date" value={editing.date || editing.paymentDate || ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value, paymentDate: e.target.value }))} /></FormField>
            <FormField label="Status" id="edit-pay-status"><Select options={statusOptions} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Payment"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete this payment of <strong>{formatMoney(deleting?.amount)}</strong>? Loan balance will be recalculated.</p>
      </Modal>
    </PageContainer>
  );
}
