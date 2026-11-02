"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import { useToast } from "@/components/contexts/ToastContext";
import StatCard from "@/components/dashboard/StatCard";
import { Receipt, Layers, Tags, Pencil, Trash2, Plus } from "lucide-react";
import { useCategories } from "@/lib/category-context";

const ITEMS_PER_PAGE = 9;

export default function OfficeExpenseSettings() {
  const { addToast } = useToast();
  const {
    expenseCategories,
    updateExpenseCategoryName,
    addExpenseCategory,
    deleteExpenseCategory,
  } = useCategories();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formMain, setFormMain] = useState("");
  const [formSubs, setFormSubs] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Initialize is not needed here - CategoryProvider already fetched on mount

  const totalSubCategories = useMemo(
    () => expenseCategories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0),
    [expenseCategories]
  );

  const visible = useMemo(() => {
    if (!search.trim()) return expenseCategories;
    const q = search.toLowerCase();
    return expenseCategories.filter(
      (c) =>
        c.mainCategory?.toLowerCase().includes(q) ||
        (c.subCategories || []).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [expenseCategories, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = visible.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditing(null);
    setFormMain("");
    setFormSubs("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setFormMain(category.mainCategory || "");
    setFormSubs((category.subCategories || []).join("\n"));
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const mainCategory = formMain.trim();
    if (!mainCategory) {
      setFormError("Main category is required.");
      return;
    }
    const subCategories = formSubs.split("\n").filter((s) => s.trim()).map((s) => s.trim());
    setSaving(true);
    try {
      if (editing) {
        // Update existing category via context method (updates MongoDB + propagates to all consumers)
        await updateExpenseCategoryName(editing.id, mainCategory, subCategories);
        addToast({ type: "success", title: "Category Updated", message: `${mainCategory} has been updated.` });
      } else {
        // Add new category via context method
        await addExpenseCategory(mainCategory, subCategories);
        addToast({ type: "success", title: "Category Added", message: `${mainCategory} has been created.` });
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormMain("");
      setFormSubs("");
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save category." });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setConfirmingDelete(true);
    try {
      await deleteExpenseCategory(deleting.id);
      setShowDeleteModal(false);
      setDeleting(null);
      addToast({ type: "success", title: "Category Deleted", message: `${deleting.mainCategory} has been removed.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete category." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <PageContainer
      title="Office Expense Settings"
      breadcrumb={<><span>Office Expense</span><span aria-hidden="true">/</span><span>Settings</span></>}
      actions={<Button variant="primary" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Category</Button>}
    >
      <section aria-label="Category statistics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Categories" value={expenseCategories.length.toLocaleString()} icon={<Layers className="h-5 w-5" aria-hidden="true" />} variant="info" />
          <StatCard title="Sub-Categories" value={totalSubCategories.toLocaleString()} icon={<Tags className="h-5 w-5" aria-hidden="true" />} variant="warning" />
          <StatCard title="Managed Here" value="Settings" icon={<Receipt className="h-5 w-5" aria-hidden="true" />} variant="success" />
        </div>
      </section>

      <section aria-label="Categories" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Expense Categories</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{visible.length} categor{visible.length === 1 ? "y" : "ies"} · used by Add Daily Expense</p>
            </div>
            <Input placeholder="Search categories or sub-categories..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search categories" />
          </div>

          { expenseCategories.length === 0 && !search.trim() ? (
            <div className="px-4 pb-6 text-center">
              <Receipt className="h-7 w-7 mx-auto text-[var(--color-ink-3)] mb-2" aria-hidden="true" />
              <p className="text-sm text-[var(--color-ink-3)]">No expense categories found.</p>
              <Button variant="outline" size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Add your first category</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-5 pb-4">
              {paginated.map((category) => (
                <div key={category.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--color-ink)] truncate">{category.mainCategory}</h3>
                      <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5">{(category.subCategories?.length || 0)} sub-categor{(category.subCategories?.length || 0) === 1 ? "y" : "ies"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(category)} aria-label={`Edit ${category.mainCategory}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(category); setShowDeleteModal(true); }} aria-label={`Delete ${category.mainCategory}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(category.subCategories || []).map((sub, idx) => (
                      <Badge key={`${sub}-${idx}`} variant="info">{sub}</Badge>
                    ))}
                    {(category.subCategories || []).length === 0 && (
                      <span className="text-[11px] text-[var(--color-ink-3)] italic">No sub-categories yet.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-5 pb-4 text-xs text-[var(--color-ink-3)]">
              <span>Page {safePage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Edit Expense Category" : "Add Expense Category"}
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{editing ? "Save Changes" : "Create Category"}</Button></>}>
        <div className="space-y-3">
          {formError && (
            <p className="text-xs font-medium text-[var(--color-error)] bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 rounded-lg px-3 py-2" role="alert">{formError}</p>
          )}
          <FormField label="Main Category" required id="exp-cat-main">
            <Input id="exp-cat-main" placeholder="e.g. Utility" value={formMain} onChange={(e) => setFormMain(e.target.value)} />
          </FormField>
          <FormField label="Sub-Categories (one per line)" id="exp-cat-subs">
            <Textarea id="exp-cat-subs" rows={5} placeholder={"Home Rent\nInternet\nElectricity"} value={formSubs} onChange={(e) => setFormSubs(e.target.value)} />
          </FormField>
          <p className="text-[11px] text-[var(--color-ink-3)]">Separate sub-categories with a new line or comma. They appear as options in Add Daily Expense.</p>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Category"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete <strong>{deleting?.mainCategory}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}