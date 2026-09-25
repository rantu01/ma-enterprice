"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import { ReceiptText, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const expenseCategories = [
  { value: "office-supplies", label: "Office Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Software" },
  { value: "furniture", label: "Furniture" },
  { value: "travel", label: "Travel" },
  { value: "communications", label: "Communications" },
  { value: "other", label: "Other" },
];

const monthOptions = [
  { value: "January 2024", label: "January 2024" },
  { value: "February 2024", label: "February 2024" },
  { value: "March 2024", label: "March 2024" },
  { value: "April 2024", label: "April 2024" },
  { value: "May 2024", label: "May 2024" },
  { value: "June 2024", label: "June 2024" },
];

export default function DataEntryPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amounts, setAmounts] = useState({});
  const [notes, setNotes] = useState("");
  const [expenses, setExpenses] = useState([]);
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
        const res = await fetch("/api/data?collection=expenses", { cache: "no-store" });
        if (res.ok) setExpenses((await res.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load expenses." });
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [addToast]);

  const handleSave = async () => {
    if (!selectedMonth) {
      addToast({ type: "warning", title: "Missing month", message: "Please select a month first." });
      return;
    }
    const entries = Object.entries(amounts).filter(([, v]) => v !== "" && Number(v) > 0);
    if (entries.length === 0) {
      addToast({ type: "warning", title: "No amounts", message: "Enter at least one expense amount." });
      return;
    }
    setLoading(true);
    try {
      const created = [];
      for (const [cat, val] of entries) {
        const label = expenseCategories.find((c) => c.value === cat)?.label || cat;
        const res = await fetch("/api/data?collection=expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: label, amount: parseFloat(val), month: selectedMonth, status: "Pending", notes }),
        });
        if (res.ok) created.push((await res.json()).data);
      }
      setExpenses((prev) => [...created, ...prev]);
      addToast({ type: "success", title: "Success", message: "Expense data saved successfully." });
      setSelectedMonth(""); setAmounts({}); setNotes("");
      setCurrentPage(1);
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save expense data." });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter((e) => [e.category, e.month, e.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [expenses, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=expenses`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setExpenses((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Expense Updated", message: "Expense has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update expense." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=expenses`, { method: "DELETE" });
      if (res.ok) {
        setExpenses((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Expense Deleted", message: "The expense has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete expense." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    { key: "category", label: "Category", accessor: "category", sortable: true, minWidth: "170px", render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "110px", render: (val) => `$${(Number(val) || 0).toLocaleString()}` },
    { key: "month", label: "Month", accessor: "month", sortable: true, minWidth: "140px", render: (v) => v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px", render: (val) => <Badge variant={val === "Approved" ? "active" : val === "Pending" ? "pending" : "processing"}>{val || "—"}</Badge> },
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
    <PageContainer title="Monthly Data Entry" breadcrumb={<nav aria-label="Breadcrumb"><span>Office Expense</span><span aria-hidden="true">/</span><span>Monthly Data Entry</span></nav>}>
      <section aria-label="Data entry form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <ReceiptText className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Enter Monthly Expenses</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Select a month and fill in category amounts.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField label="Select Month" id="month" required className="sm:col-span-2 lg:col-span-1">
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={monthOptions} placeholder="Choose a month" />
            </FormField>
            {expenseCategories.map((cat) => (
              <FormField key={cat.value} label={cat.label} id={cat.value}>
                <Input type="number" min="0" placeholder="0.00" value={amounts[cat.value] || ""} onChange={(e) => setAmounts((prev) => ({ ...prev, [cat.value]: e.target.value }))} />
              </FormField>
            ))}
            <FormField label="Notes" id="notes" className="sm:col-span-2 lg:col-span-3">
              <Textarea placeholder="Add any notes about these expenses..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </FormField>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
            <Button variant="secondary" size="sm" onClick={() => { setSelectedMonth(""); setAmounts({}); setNotes(""); }}>Clear</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={loading}>Save Expenses</Button>
          </div>
        </Card>
      </section>

      <section aria-label="Existing expenses" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Existing Expenses</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search expenses..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search expenses" />
          </div>
          {fetching ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No expenses recorded yet."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Expense"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category" id="edit-exp-cat"><Input value={editing.category || ""} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-exp-amount"><Input type="number" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Month" id="edit-exp-month"><Select options={monthOptions} value={editing.month || ""} onChange={(e) => setEditing((p) => ({ ...p, month: e.target.value }))} /></FormField>
            <FormField label="Status" id="edit-exp-status">
              <Select options={[{ value: "Pending", label: "Pending" }, { value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }]} value={editing.status || "Pending"} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Expense"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete the <strong>{deleting?.category}</strong> expense? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
