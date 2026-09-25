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
import { CreditCard, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const paymentMethodMap = {
  bank_transfer: "Bank Transfer",
  wire_transfer: "Wire Transfer",
  check: "Check",
  credit_card: "Credit Card",
};

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "check", label: "Check" },
  { value: "credit_card", label: "Credit Card" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
];

export default function PayLoanPage() {
  const { addToast } = useToast();
  const [selectedLoan, setSelectedLoan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
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
        const [loanRes, payRes] = await Promise.all([
          fetch("/api/data?collection=loans", { cache: "no-store" }),
          fetch("/api/data?collection=payments", { cache: "no-store" }),
        ]);
        if (loanRes.ok) setLoans((await loanRes.json()).data || []);
        if (payRes.ok) setPayments((await payRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const loanOptions = [
    { value: "", label: "Select a loan to pay" },
    ...loans.map((l) => ({ value: l.id, label: `${l.organizationName || l.id} ($${(l.amount || 0).toLocaleString()})` })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) {
      addToast({ type: "warning", title: "Missing loan", message: "Please select a loan first." });
      return;
    }
    setIsSubmitting(true);
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
        setCurrentPage(1);
        e.target.reset();
        setSelectedLoan("");
        addToast({ type: "success", title: "Payment Submitted", message: "Your payment has been recorded." });
      } else addToast({ type: "error", title: "Error", message: "Failed to submit payment." });
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((p) => [p.loanId, p.loanOrganization, p.method, p.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [payments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=payments`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setPayments((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Payment Updated", message: "Payment has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update payment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=payments`, { method: "DELETE" });
      if (res.ok) {
        setPayments((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Payment Deleted", message: "The payment has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete payment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const paymentHistoryColumns = [
    { key: "loanOrganization", label: "Organization", accessor: "loanOrganization", sortable: true, minWidth: "170px", render: (v, r) => v || r.loanId || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "110px", render: (val) => `$${(Number(val) || 0).toLocaleString()}` },
    { key: "method", label: "Method", accessor: "method", sortable: true, minWidth: "140px", render: (val) => <Badge variant="info">{paymentMethodMap[val] || val || "—"}</Badge> },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => v || "—" },
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

  const outstandingAmount = selectedLoan ? loans.find((l) => l.id === selectedLoan) : null;

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
              <p className="text-xs text-[var(--color-ink-3)]">Pay towards an outstanding loan.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Select Loan" required id="pay-loan">
                <Select options={loanOptions} value={selectedLoan} onChange={(e) => setSelectedLoan(e.target.value)} placeholder="Select a loan" required id="pay-loan" />
              </FormField>
              <FormField label="Outstanding Amount" id="pay-outstanding">
                <Input id="pay-outstanding" value={outstandingAmount ? `$${(outstandingAmount.amount || 0).toLocaleString()}` : ""} placeholder="Select a loan first" disabled />
              </FormField>
              <FormField label="Payment Amount ($)" required id="pay-amount">
                <Input id="pay-amount" type="number" placeholder="0.00" required min="0" />
              </FormField>
              <FormField label="Payment Date" required id="pay-date">
                <Input id="pay-date" type="date" required />
              </FormField>
              <FormField label="Payment Method" required id="pay-method" className="sm:col-span-2 lg:col-span-2">
                <Select options={paymentMethods} placeholder="Select payment method" required id="pay-method" />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setSelectedLoan("")}>Clear</Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>{isSubmitting ? "Processing..." : "Submit Payment"}</Button>
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
            <FormField label="Date" id="edit-pay-date"><Input type="date" value={editing.date || ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))} /></FormField>
            <FormField label="Status" id="edit-pay-status"><Select options={statusOptions} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Payment"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete this payment of <strong>${Number(deleting?.amount || 0).toLocaleString()}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
