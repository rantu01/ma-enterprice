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
import StatCard from "@/components/dashboard/StatCard";
import { useToast } from "@/components/contexts/ToastContext";
import { ReceiptText, Pencil, Trash2, Plus, Printer, FileText, Wallet } from "lucide-react";
import {
  ENTRY_STATUSES,
  formatMoney,
  formatMonthLabel,
  getCurrentMonthCode,
  getMaxEntryDateStr,
  getNextVoucherNo,
  isApprovedEntry,
  isFutureMonthDateStr,
  monthCodeFromDate,
} from "@/lib/office-expense-utils";

const ITEMS_PER_PAGE = 10;

export default function AddDailyExpensePage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [months, setMonths] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthCode());
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryDate, setEntryDate] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [entryCategory, setEntryCategory] = useState("");
  const [entrySub, setEntrySub] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [entryStatus, setEntryStatus] = useState("Approved");
  const [formError, setFormError] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [printTarget, setPrintTarget] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, entryRes, monthRes] = await Promise.all([
          fetch("/api/data?collection=expenseCategories", { cache: "no-store" }),
          fetch("/api/data?collection=expenseEntries", { cache: "no-store" }),
          fetch("/api/data?collection=expenseMonths", { cache: "no-store" }),
        ]);
        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (entryRes.ok) setEntries((await entryRes.json()).data || []);
        if (monthRes.ok) {
          const list = (await monthRes.json()).data || [];
          setMonths(list);
          const current = getCurrentMonthCode();
          if (list.some((m) => m.month === current)) {
            setSelectedMonth(current);
          } else if (list.length > 0) {
            // Auto-create the running month so staff never add months manually.
            try {
              const res = await fetch("/api/data?collection=expenseMonths", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: current, preparedBy: "Admin" }),
              });
              if (res.ok) {
                const data = await res.json();
                setMonths((prev) => [...prev, data.data]);
              }
            } catch {
              /* non-fatal */
            }
            setSelectedMonth(current);
          }
        }
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load expense data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.mainCategory] = c.subCategories || [];
    });
    return map;
  }, [categories]);

  const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.mainCategory, label: c.mainCategory })), [categories]);
  const monthOptions = useMemo(() => [...new Set(months.map((m) => m.month))].filter(Boolean).sort(), [months]);
  const maxEntryDate = useMemo(() => getMaxEntryDateStr(), []);

  const currentMonthCode = getCurrentMonthCode();
  const currentMonthEntries = useMemo(() => entries.filter((e) => e.month === currentMonthCode), [entries, currentMonthCode]);
  const currentMonthTotal = useMemo(
    () => currentMonthEntries.filter(isApprovedEntry).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [currentMonthEntries]
  );

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterMonth !== "all" && e.month !== filterMonth) return false;
      if (filterDate && String(e.date || "").slice(0, 10) !== filterDate) return false;
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (!q) return true;
      return [e.voucherNo, e.category, e.subCategory, e.description].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [entries, filterMonth, filterDate, filterCategory, search]);

  const filteredTotal = useMemo(() => filteredEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0), [filteredEntries]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredEntries.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setFilterMonth("all");
    setFilterDate("");
    setFilterCategory("all");
    setSearch("");
    setCurrentPage(1);
  };

  const openAddEntry = () => {
    if (categories.length === 0) {
      addToast({ type: "warning", title: "No categories", message: "Add expense categories in Settings first." });
      return;
    }
    setEditingEntry(null);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setVoucherNo(getNextVoucherNo(entries));
    setEntryCategory(categories[0]?.mainCategory || "");
    setEntrySub("");
    setDescription("");
    setAmount("");
    setEntryStatus("Approved");
    setFormError("");
    setIsEntryModalOpen(true);
  };

  const openEditEntry = (entry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date ? String(entry.date).slice(0, 10) : "");
    setVoucherNo(entry.voucherNo || "");
    setEntryCategory(entry.category || "");
    setEntrySub(entry.subCategory || "");
    setDescription(entry.description || "");
    setAmount(String(entry.amount ?? ""));
    setEntryStatus(entry.approvalStatus || entry.status || "Approved");
    setFormError("");
    setIsEntryModalOpen(true);
  };

  const ensureMonthExists = async (monthCode) => {
    if (!monthCode || months.some((m) => m.month === monthCode)) return;
    try {
      const res = await fetch("/api/data?collection=expenseMonths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthCode, preparedBy: "Admin" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMonths((prev) => [...prev, data.data]);
      }
    } catch {
      /* non-fatal */
    }
  };

  const handleSaveEntry = async () => {
    if (!entryCategory.trim()) {
      setFormError("Category is required.");
      return;
    }
    if (entryDate && isFutureMonthDateStr(entryDate)) {
      setFormError("Date must not be in a future (not-yet-started) month.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      setFormError("Amount must be a valid non-negative number.");
      return;
    }
    const monthCode = entryDate ? monthCodeFromDate(entryDate) : selectedMonth;
    if (!monthCode) {
      setFormError("A valid date is required to determine the month.");
      return;
    }
    setSavingEntry(true);
    try {
      await ensureMonthExists(monthCode);
      if (editingEntry) {
        const payload = {
          ...editingEntry,
          month: monthCode,
          date: entryDate || null,
          category: entryCategory.trim(),
          subCategory: entrySub,
          description,
          amount: amt,
          approvalStatus: entryStatus,
          status: entryStatus,
        };
        const res = await fetch(`/api/data?id=${editingEntry.id}&collection=expenseEntries`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("update failed");
        const data = await res.json();
        const updated = data.data || payload;
        setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? { ...e, ...updated } : e)));
        addToast({ type: "success", title: "Entry Updated", message: `Voucher ${voucherNo} has been updated.` });
      } else {
        const nextVoucher = getNextVoucherNo(entries);
        const payload = {
          month: monthCode,
          date: entryDate || null,
          voucherNo: nextVoucher,
          category: entryCategory.trim(),
          subCategory: entrySub,
          description,
          amount: amt,
          approvalStatus: "Approved",
          status: "Approved",
        };
        const res = await fetch("/api/data?collection=expenseEntries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("create failed");
        const data = await res.json();
        setEntries((prev) => [data.data, ...prev]);
        setCurrentPage(1);
        addToast({ type: "success", title: "Entry Added", message: `Voucher ${data.data?.voucherNo || nextVoucher} recorded.` });
      }
      setIsEntryModalOpen(false);
      setEditingEntry(null);
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save entry." });
    } finally {
      setSavingEntry(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=expenseEntries`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setEntries((prev) => prev.filter((e) => e.id !== deleting.id));
      setShowDeleteModal(false);
      setDeleting(null);
      addToast({ type: "success", title: "Entry Deleted", message: `Voucher ${deleting.voucherNo} has been removed.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete entry." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const handlePrint = () => window.print();

  const columns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "110px", render: (v) => (v ? String(v).slice(0, 10) : "—") },
    { key: "voucherNo", label: "Voucher", accessor: "voucherNo", sortable: true, minWidth: "150px", render: (v) => v || "—" },
    {
      key: "category", label: "Category / Subcategory", accessor: "category", sortable: true, minWidth: "190px",
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-ink)] truncate">{v || "—"}</p>
          <p className="text-xs text-[var(--color-ink-3)] truncate">{row.subCategory || "—"}</p>
        </div>
      ),
    },
    { key: "description", label: "Description", accessor: "description", sortable: false, minWidth: "180px", render: (v) => <span className="block max-w-55 truncate" title={v}>{v || "—"}</span> },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "110px", render: (v) => formatMoney(v) },
    {
      key: "approvalStatus", label: "Status", accessor: "approvalStatus", sortable: true, minWidth: "110px",
      render: (v, row) => {
        const s = v || row.status || "Approved";
        return <Badge variant={s === "Approved" ? "active" : s === "Rejected" ? "cancelled" : "pending"}>{s}</Badge>;
      },
    },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPrintTarget(row)} aria-label={`Print ${row.voucherNo}`}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditEntry(row)} aria-label={`Edit ${row.voucherNo}`}>
            <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(row); setShowDeleteModal(true); }} aria-label={`Delete ${row.voucherNo}`}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Add Daily Expense"
      breadcrumb={<><span>Office Expense</span><span aria-hidden="true">/</span><span>Add Daily Expense</span></>}
      actions={<Button variant="primary" size="sm" onClick={openAddEntry}><Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Office Expense</Button>}
    >
      <section aria-label="Month summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="This Month Vouchers" value={currentMonthEntries.length.toLocaleString()} icon={<FileText className="h-5 w-5" aria-hidden="true" />} variant="info" />
          <StatCard title="This Month Expense" value={formatMoney(currentMonthTotal)} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="warning" />
          <StatCard title="Filtered Total" value={formatMoney(filteredTotal)} icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />} variant="success" />
        </div>
      </section>

      <section aria-label="Expense entries" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-end gap-3 px-4 sm:px-5 pt-4 pb-3">
            <FormField label="Month" id="filter-month" className="w-full sm:w-44">
              <Select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                options={[{ value: "all", label: "All months" }, ...monthOptions.map((m) => ({ value: m, label: formatMonthLabel(m) }))]} placeholder="All months" id="filter-month" />
            </FormField>
            <FormField label="Date" id="filter-date" className="w-full sm:w-44">
              <Input id="filter-date" type="date" max={maxEntryDate} value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }} />
            </FormField>
            <FormField label="Category" id="filter-category" className="w-full sm:w-48">
              <Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                options={[{ value: "all", label: "All categories" }, ...categoryOptions]} placeholder="All categories" id="filter-category" />
            </FormField>
            <FormField label="Search" id="filter-search" className="w-full sm:w-56">
              <Input id="filter-search" placeholder="Search vouchers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} aria-label="Search vouchers" />
            </FormField>
            <div className="flex gap-2 pb-0.5">
              <Button variant="secondary" size="sm" onClick={resetFilters}>Clear</Button>
              
            </div>
          </div>
          <div className="px-4 sm:px-5 pb-2">
            <p className="text-xs text-[var(--color-ink-3)]">{filteredEntries.length} record{filteredEntries.length === 1 ? "" : "s"} · total {formatMoney(filteredTotal)}</p>
          </div>
          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={6} height={48} /></div>
          ) : (
            <DataTable columns={columns} data={paginated} emptyMessage="No entries match the current filters."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filteredEntries.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={isEntryModalOpen} onClose={() => { setIsEntryModalOpen(false); setEditingEntry(null); }} title={editingEntry ? "Edit Expense Entry" : "Add Daily Expense"}
        footer={<><Button variant="secondary" onClick={() => { setIsEntryModalOpen(false); setEditingEntry(null); }}>Cancel</Button><Button onClick={handleSaveEntry} loading={savingEntry}>{editingEntry ? "Save Changes" : "Add Entry"}</Button></>}>
        <div className="space-y-3">
          {formError && <p className="text-xs font-medium text-[var(--color-error)] bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 rounded-lg px-3 py-2" role="alert">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Date" required id="entry-date">
              <Input id="entry-date" type="date" max={maxEntryDate} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </FormField>
            <FormField label="Voucher No. (auto)" id="entry-voucher">
              <Input id="entry-voucher" value={voucherNo} readOnly disabled placeholder="Auto-generated" />
            </FormField>
            <FormField label="Category" required id="entry-category">
              <Select options={categoryOptions} value={entryCategory} onChange={(e) => { setEntryCategory(e.target.value); setEntrySub(""); }} placeholder="Select category" id="entry-category" />
            </FormField>
            <FormField label="Sub-Category" id="entry-sub">
              <Select options={[{ value: "", label: "— None —" }, ...(categoryMap[entryCategory] || []).map((s) => ({ value: s, label: s }))]} value={entrySub} onChange={(e) => setEntrySub(e.target.value)} placeholder="Select sub-category" id="entry-sub" />
            </FormField>
          </div>
          <FormField label="Description" id="entry-desc">
            <Textarea id="entry-desc" rows={2} placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Amount" required id="entry-amount">
              <Input id="entry-amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormField>
            {editingEntry && (
              <FormField label="Status" id="entry-status">
                <Select options={ENTRY_STATUSES} value={entryStatus} onChange={(e) => setEntryStatus(e.target.value)} id="entry-status" />
              </FormField>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Expense Entry"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Delete voucher <strong>{deleting?.voucherNo}</strong>? This cannot be undone.</p>
      </Modal>

      <Modal isOpen={!!printTarget} onClose={() => setPrintTarget(null)} title={`Expense Voucher — ${printTarget?.voucherNo || ""}`}
        footer={<><Button variant="secondary" onClick={() => setPrintTarget(null)}>Close</Button><Button onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Print Voucher</Button></>}>
        {printTarget && (
          <div className="rounded-xl border border-[var(--color-line)] p-5 text-[var(--color-ink)]">
            <div className="text-center border-b border-[var(--color-line)] pb-3 mb-4">
              <h2 className="text-lg font-bold tracking-wide">MAA Enterprise</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Office Expense Voucher</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <p><strong>Voucher No:</strong> {printTarget.voucherNo || "—"}</p>
              <p><strong>Date:</strong> {printTarget.date ? String(printTarget.date).slice(0, 10) : "—"}</p>
              <p><strong>Month:</strong> {printTarget.month || "—"}</p>
              <p><strong>Status:</strong> {printTarget.approvalStatus || printTarget.status || "Approved"}</p>
              <p className="col-span-2"><strong>Category:</strong> {printTarget.category || "—"}{printTarget.subCategory ? ` / ${printTarget.subCategory}` : ""}</p>
              <p className="col-span-2"><strong>Description:</strong> {printTarget.description || "—"}</p>
              <p className="col-span-2 text-base"><strong>Amount:</strong> {formatMoney(printTarget.amount)}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 text-center text-[11px] text-[var(--color-ink-3)]">
              <div><div className="border-t border-[var(--color-line)] pt-1 mt-8">Prepared By</div></div>
              <div><div className="border-t border-[var(--color-line)] pt-1 mt-8">Checked By</div></div>
              <div><div className="border-t border-[var(--color-line)] pt-1 mt-8">Approved By</div></div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
