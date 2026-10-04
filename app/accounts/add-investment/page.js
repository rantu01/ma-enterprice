"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { TrendingUp, Pencil, Trash2, Users, Plus } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const categoryOptions = [
  { value: "stocks", label: "Stocks" },
  { value: "bonds", label: "Bonds" },
  { value: "real-estate", label: "Real Estate" },
  { value: "mutual-funds", label: "Mutual Funds" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const emptyForm = { date: todayStr(), investorId: "", amount: "", notes: "" };

export default function AddInvestmentPage() {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Investor management state (fixed list stored in the `investors` collection)
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [investorName, setInvestorName] = useState("");
  const [investorError, setInvestorError] = useState("");
  const [savingInvestor, setSavingInvestor] = useState(false);
  const [deletingInvestor, setDeletingInvestor] = useState(null);
  const [showDeleteInvestorModal, setShowDeleteInvestorModal] = useState(false);
  const [confirmingInvestorDelete, setConfirmingInvestorDelete] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, investorRes] = await Promise.all([
          fetch("/api/data?collection=investments", { cache: "no-store" }),
          fetch("/api/data?collection=investors", { cache: "no-store" }),
        ]);
        if (invRes.ok) setInvestments((await invRes.json()).data || []);
        if (investorRes.ok) setInvestors((await investorRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load investments." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const investorById = useMemo(() => {
    const map = {};
    investors.forEach((i) => { if (i?.id) map[String(i.id)] = i; });
    return map;
  }, [investors]);

  const investorOptions = useMemo(
    () => investors.map((i) => ({ value: i.id, label: i.name })),
    [investors]
  );

  /** Resolve the display name of an investment's investor (legacy docs may predate investors). */
  const resolveInvestorName = (inv) => {
    if (inv?.investorId && investorById[String(inv.investorId)]) return investorById[String(inv.investorId)].name;
    if (inv?.investor) return inv.investor;
    return "";
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!formData.date) e.date = "Date is required.";
    if (!formData.investorId) e.investorId = "Please select an investor.";
    else if (!investorById[String(formData.investorId)]) e.investorId = "Selected investor no longer exists.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = "Amount must be greater than 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (investors.length === 0) {
      addToast({ type: "warning", title: "No investors", message: "Add an investor first, then record the investment." });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const investor = investorById[String(formData.investorId)];
      const res = await fetch("/api/data?collection=investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investorId: formData.investorId,
          investor: investor?.name || "",
          date: formData.date,
          amount: parseFloat(formData.amount),
          notes: formData.notes.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestments((prev) => [data.data, ...prev]);
        setFormData({ ...emptyForm, date: todayStr() });
        setCurrentPage(1);
        addToast({ type: "success", title: "Investment Added", message: `৳${formData.amount} from ${investor?.name || "investor"} has been recorded.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add investment." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Investor management (fixed list) ---------- */

  const openAddInvestor = () => {
    setEditingInvestor(null);
    setInvestorName("");
    setInvestorError("");
    setShowInvestorModal(true);
  };

  const openEditInvestor = (inv) => {
    setEditingInvestor(inv);
    setInvestorName(inv.name || "");
    setInvestorError("");
    setShowInvestorModal(true);
  };

  const investorNameExists = (name, exceptId) =>
    investors.some((i) => String(i.name || "").trim().toLowerCase() === name.toLowerCase() && i.id !== exceptId);

  const investmentsOfInvestor = (investor) =>
    investments.filter(
      (e) =>
        (investor?.id && String(e.investorId) === String(investor.id)) ||
        (!e.investorId && String(e.investor || "").trim().toLowerCase() === String(investor?.name || "").trim().toLowerCase() && String(investor?.name || "").trim())
    );

  const handleSaveInvestor = async () => {
    const name = investorName.trim();
    if (!name) {
      setInvestorError("Investor name is required.");
      return;
    }
    if (investorNameExists(name, editingInvestor?.id)) {
      setInvestorError(`"${name}" already exists.`);
      return;
    }
    setSavingInvestor(true);
    try {
      if (editingInvestor) {
        const res = await fetch(`/api/data?id=${editingInvestor.id}&collection=investors`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editingInvestor, name }),
        });
        if (!res.ok) throw new Error("update failed");
        const data = await res.json();
        const updated = data.data || { ...editingInvestor, name };
        setInvestors((prev) => prev.map((x) => (x.id === editingInvestor.id ? { ...x, ...updated } : x)));
        addToast({ type: "success", title: "Investor Updated", message: `${name} has been updated.` });
      } else {
        const res = await fetch("/api/data?collection=investors", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("create failed");
        const data = await res.json();
        setInvestors((prev) => [data.data, ...prev]);
        addToast({ type: "success", title: "Investor Added", message: `${name} has been added.` });
      }
      setShowInvestorModal(false);
      setEditingInvestor(null);
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save investor." });
    } finally {
      setSavingInvestor(false);
    }
  };

  const handleConfirmDeleteInvestor = async () => {
    if (!deletingInvestor) return;
    if (investmentsOfInvestor(deletingInvestor).length > 0) {
      addToast({ type: "warning", title: "Cannot delete", message: `${deletingInvestor.name} has investment records and cannot be deleted.` });
      return;
    }
    setConfirmingInvestorDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deletingInvestor.id}&collection=investors`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setInvestors((prev) => prev.filter((x) => x.id !== deletingInvestor.id));
      setShowDeleteInvestorModal(false);
      setDeletingInvestor(null);
      addToast({ type: "success", title: "Investor Deleted", message: "The investor has been removed." });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete investor." });
    } finally {
      setConfirmingInvestorDelete(false);
    }
  };

  /* ---------- Investor-wise lifetime report (from actual investment records) ---------- */

  const investorReport = useMemo(() => {
    const totals = {};
    const counts = {};
    investments.forEach((e) => {
      const key = e.investorId ? `id:${e.investorId}` : (e.investor ? `name:${String(e.investor).trim().toLowerCase()}` : "unassigned");
      totals[key] = (totals[key] || 0) + (Number(e.amount) || 0);
      counts[key] = (counts[key] || 0) + 1;
    });
    const rows = investors.map((inv) => {
      const key = `id:${inv.id}`;
      // Records stored by name before the investor got an id still belong to them.
      const nameKey = `name:${String(inv.name || "").trim().toLowerCase()}`;
      return {
        id: inv.id,
        investor: inv.name,
        records: (counts[key] || 0) + (counts[nameKey] || 0),
        total: (totals[key] || 0) + (totals[nameKey] || 0),
      };
    });
    const seen = new Set(rows.flatMap((r) => {
      const inv = investors.find((i) => i.id === r.id);
      return [`id:${r.id}`, `name:${String(inv?.name || "").trim().toLowerCase()}`];
    }));
    // Investments without any matching investor (legacy records).
    const orphanKeys = Object.keys(totals).filter((k) => !seen.has(k));
    orphanKeys.forEach((k) => {
      const label = k === "unassigned" ? "Unassigned (legacy records)" : String(k.replace(/^name:/, ""));
      rows.push({ id: k, investor: label, records: counts[k] || 0, total: totals[k] || 0, legacy: true });
    });
    return rows.sort((a, b) => b.total - a.total);
  }, [investments, investors]);

  const reportTotal = useMemo(() => investorReport.reduce((s, r) => s + (Number(r.total) || 0), 0), [investorReport]);

  /* ---------- Investment list ---------- */

  const filtered = useMemo(() => {
    if (!search.trim()) return investments;
    const q = search.toLowerCase();
    return investments.filter((i) => [resolveInvestorName(i), i.name, i.category, i.status, i.notes].some((v) => String(v || "").toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, search, investors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=investments`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setInvestments((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Investment Updated", message: "Investment has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update investment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=investments`, { method: "DELETE" });
      if (res.ok) {
        setInvestments((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Investment Deleted", message: "The investment has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete investment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const openEditInvestment = (row) => {
    const invId = row.investorId && investorById[String(row.investorId)] ? String(row.investorId) : "";
    setEditing({ ...row, investorId: invId });
    setShowEditModal(true);
  };

  const handleEditInvestorChange = (investorId) => {
    const inv = investorById[String(investorId)];
    setEditing((p) => ({ ...p, investorId, investor: inv?.name || p?.investor || "" }));
  };

  const columns = [
    { key: "investor", label: "Investor", accessor: "investorId", sortable: true, minWidth: "160px", render: (v, row) => resolveInvestorName({ ...row, investorId: v }) || "—" },
    { key: "name", label: "Investment", accessor: "name", sortable: true, minWidth: "180px", render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => `৳${(Number(v) || 0).toLocaleString()}` },
    { key: "category", label: "Category", accessor: "category", sortable: true, minWidth: "130px", render: (v) => v || "—" },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px", render: (v) => <Badge variant={v === "active" ? "active" : v === "completed" ? "completed" : "pending"}>{v || "—"}</Badge> },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditInvestment(row)}><Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(row); setShowDeleteModal(true); }}><Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete</Button>
        </div>
      ),
    },
  ];

  const reportColumns = [
    { key: "investor", label: "Investor", accessor: "investor", sortable: true, render: (v) => <span className="font-medium">{v || "—"}</span> },
    { key: "records", label: "Investments", accessor: "records", sortable: true, render: (v) => Number(v || 0).toLocaleString() },
    { key: "total", label: "Lifetime Total", accessor: "total", sortable: true, render: (v) => <span className="font-semibold">৳{(Number(v) || 0).toLocaleString()}</span> },
  ];

  return (
    <PageContainer title="Add Investment" breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span><span aria-hidden="true">/</span><span>Add Investment</span></nav>}>
      <section aria-label="Add investment form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] leading-tight">Add Investment</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Record a new company investment.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FormField label="Date" error={errors.date} id="investment-date" required>
                <Input id="investment-date" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} error={!!errors.date} required />
              </FormField>
              <FormField label="Select Investor" error={errors.investorId} id="investment-investor" required>
                <Select options={investorOptions} value={formData.investorId} onChange={(e) => handleChange("investorId", e.target.value)} placeholder={investors.length === 0 ? "Add an investor below first" : "Select investor"} error={!!errors.investorId} id="investment-investor" />
              </FormField>
              <FormField label="Amount" error={errors.amount} id="investment-amount" required>
                <Input id="investment-amount" type="number" min="0" step="0.01" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!errors.amount} required />
              </FormField>
              <FormField label="Note" id="investment-note">
                <Textarea id="investment-note" placeholder="Note (optional)" rows={2} value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setFormData({ ...emptyForm, date: todayStr() }); setErrors({}); }}>Clear</Button>
              <Button type="submit" size="sm" loading={submitting}>Submit</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Investor management" className="mt-6">
        <Card padding="5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] leading-tight">Investors</h2>
                <p className="text-xs text-[var(--color-ink-3)]">{investors.length} investor{investors.length === 1 ? "" : "s"} · fixed list used by the form above</p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={openAddInvestor}><Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Investor</Button>
          </div>
          {loading ? (
            <Skeleton count={3} height={48} />
          ) : investors.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-3)] py-6 text-center">No investors yet. Add your first investor to start recording investments.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]" role="list">
              {investors.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="font-medium text-[var(--color-ink)] truncate">{inv.name}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditInvestor(inv)} aria-label={`Edit ${inv.name}`}><Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit</Button>
                    <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeletingInvestor(inv); setShowDeleteInvestorModal(true); }} aria-label={`Delete ${inv.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section aria-label="Investor-wise lifetime investment report" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Investor-wise Lifetime Investment</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Calculated from actual investment records · lifetime total ৳{reportTotal.toLocaleString()}</p>
            </div>
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={4} height={48} /></div> : (
            <DataTable columns={reportColumns} data={investorReport} emptyMessage="No investment records yet." />
          )}
        </Card>
      </section>

      <section aria-label="Existing investments" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Investments</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search investments..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search investments" />
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No investments found. Add your first investment above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showInvestorModal} onClose={() => { setShowInvestorModal(false); setEditingInvestor(null); }} title={editingInvestor ? "Edit Investor" : "Add Investor"}
        footer={<><Button variant="secondary" onClick={() => { setShowInvestorModal(false); setEditingInvestor(null); }}>Cancel</Button><Button onClick={handleSaveInvestor} loading={savingInvestor}>{editingInvestor ? "Save Changes" : "Add Investor"}</Button></>}>
        <FormField label="Investor Name" error={investorError} id="investor-name" required>
          <Input id="investor-name" placeholder="Enter investor name" value={investorName} onChange={(e) => { setInvestorName(e.target.value); setInvestorError(""); }} error={!!investorError} />
        </FormField>
      </Modal>

      <Modal isOpen={showDeleteInvestorModal} onClose={() => { setShowDeleteInvestorModal(false); setDeletingInvestor(null); }} title="Delete Investor"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteInvestorModal(false); setDeletingInvestor(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDeleteInvestor} loading={confirmingInvestorDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete investor <strong>{deletingInvestor?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Investment"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Investor" id="edit-inv-investor">
              <Select options={investorOptions} value={editing.investorId || ""} onChange={(e) => handleEditInvestorChange(e.target.value)} placeholder="Select investor" id="edit-inv-investor" />
            </FormField>
            <FormField label="Date" id="edit-inv-date"><Input type="date" value={editing.date || ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-inv-amount"><Input type="number" min="0" step="0.01" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Note" id="edit-inv-note"><Input value={editing.notes || ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} /></FormField>
            <FormField label="Name (legacy)" id="edit-inv-name"><Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="Category (legacy)" id="edit-inv-cat"><Select options={categoryOptions} value={editing.category || ""} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} /></FormField>
            <FormField label="Status (legacy)" id="edit-inv-status"><Select options={statusOptions} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Investment"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete this investment of <strong>৳{Number(deleting?.amount || 0).toLocaleString()}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
