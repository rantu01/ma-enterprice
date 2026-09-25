"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { Landmark, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const frequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const emptyForm = {
  organizationName: "",
  amount: "",
  interestRate: "",
  term: "",
  startDate: "",
  dueDate: "",
  frequency: "",
  notes: "",
};

export default function AddLoanPage() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const [orgRes, loanRes] = await Promise.all([
          fetch("/api/data?collection=organizations", { cache: "no-store" }),
          fetch("/api/data?collection=loans", { cache: "no-store" }),
        ]);
        if (orgRes.ok) setOrganizations((await orgRes.json()).data || []);
        if (loanRes.ok) setLoans((await loanRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const orgOptions = organizations.map((o) => ({ value: o.name, label: o.name }));

  const handleChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationName || !formData.amount) {
      addToast({ type: "warning", title: "Missing information", message: "Organization and amount are required." });
      return;
    }
    setIsSubmitting(true);
    try {
      const org = organizations.find((o) => o.name === formData.organizationName);
      const res = await fetch("/api/data?collection=loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org?.id || formData.organizationName,
          organizationName: formData.organizationName,
          amount: parseFloat(formData.amount) || 0,
          interestRate: parseFloat(formData.interestRate) || 0,
          term: parseInt(formData.term) || 12,
          frequency: formData.frequency,
          status: "active",
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          notes: formData.notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoans((prev) => [data.data, ...prev]);
        setFormData(emptyForm);
        setCurrentPage(1);
        addToast({ type: "success", title: "Loan Added", message: "Loan application has been created successfully." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add loan." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return loans;
    const q = search.toLowerCase();
    return loans.filter((l) =>
      [l.organizationName, l.status, String(l.amount)].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [loans, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=loans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setLoans((prev) => prev.map((l) => (l.id === editing.id ? { ...l, ...updated } : l)));
        setShowEditModal(false);
        setEditing(null);
        addToast({ type: "success", title: "Loan Updated", message: "Loan has been updated." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to update loan." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=loans`, { method: "DELETE" });
      if (res.ok) {
        setLoans((prev) => prev.filter((l) => l.id !== deleting.id));
        setShowDeleteModal(false);
        setDeleting(null);
        addToast({ type: "success", title: "Loan Deleted", message: "The loan has been removed." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to delete loan." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const columns = [
    { key: "organizationName", label: "Organization", accessor: "organizationName", sortable: true, minWidth: "180px", render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => `$${(Number(v) || 0).toLocaleString()}` },
    { key: "interestRate", label: "Rate %", accessor: "interestRate", sortable: true, minWidth: "90px", render: (v) => `${v ?? "—"}` },
    { key: "term", label: "Term (mo)", accessor: "term", sortable: true, minWidth: "100px", render: (v) => v ?? "—" },
    {
      key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px",
      render: (v) => <Badge variant={v === "active" ? "active" : v === "paid" ? "paid" : v === "overdue" ? "overdue" : "pending"}>{v || "—"}</Badge>,
    },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...row }); setShowEditModal(true); }}>
            <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(row); setShowDeleteModal(true); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Add Loan"
      breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Add Loan</span></>}
    >
      <section aria-label="Add loan form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Add Loan</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Create a new loan application.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Organization" required id="loan-org">
                <Select options={orgOptions} value={formData.organizationName} onChange={(e) => handleChange("organizationName", e.target.value)} placeholder="Select organization" required id="loan-org" />
              </FormField>
              <FormField label="Loan Amount ($)" required id="loan-amount">
                <Input id="loan-amount" type="number" placeholder="0.00" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} required min="0" />
              </FormField>
              <FormField label="Interest Rate (%)" id="loan-rate">
                <Input id="loan-rate" type="number" step="0.01" placeholder="0.00" value={formData.interestRate} onChange={(e) => handleChange("interestRate", e.target.value)} min="0" />
              </FormField>
              <FormField label="Term (months)" id="loan-term">
                <Input id="loan-term" type="number" placeholder="12" value={formData.term} onChange={(e) => handleChange("term", e.target.value)} min="1" />
              </FormField>
              <FormField label="Start Date" id="loan-start">
                <Input id="loan-start" type="date" value={formData.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
              </FormField>
              <FormField label="Due Date" id="loan-due">
                <Input id="loan-due" type="date" value={formData.dueDate} onChange={(e) => handleChange("dueDate", e.target.value)} />
              </FormField>
              <FormField label="Payment Frequency" id="loan-frequency">
                <Select options={frequencyOptions} value={formData.frequency} onChange={(e) => handleChange("frequency", e.target.value)} placeholder="Select frequency" id="loan-frequency" />
              </FormField>
              <FormField label="Notes" id="loan-notes" className="sm:col-span-2">
                <Textarea id="loan-notes" placeholder="Additional notes (optional)" rows={2} value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setFormData(emptyForm)}>Clear</Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>{isSubmitting ? "Submitting..." : "Add Loan"}</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Existing loans" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Loans</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search loans..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search loans" />
          </div>
          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div>
          ) : (
            <DataTable
              columns={columns}
              data={paginated}
              emptyMessage="No loans found. Add your first loan above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }}
            />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Loan"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Organization" id="edit-loan-org"><Input value={editing.organizationName || ""} onChange={(e) => setEditing((p) => ({ ...p, organizationName: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-loan-amount"><Input type="number" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Interest Rate" id="edit-loan-rate"><Input type="number" step="0.01" value={editing.interestRate || ""} onChange={(e) => setEditing((p) => ({ ...p, interestRate: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Term" id="edit-loan-term"><Input type="number" value={editing.term || ""} onChange={(e) => setEditing((p) => ({ ...p, term: parseInt(e.target.value) || 0 }))} /></FormField>
            <FormField label="Status" id="edit-loan-status">
              <Select options={statusOptions} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} />
            </FormField>
            <FormField label="Due Date" id="edit-loan-due"><Input type="date" value={editing.dueDate || ""} onChange={(e) => setEditing((p) => ({ ...p, dueDate: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Loan"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete the loan for <strong>{deleting?.organizationName}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
