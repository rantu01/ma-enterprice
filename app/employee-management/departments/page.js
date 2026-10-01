"use client";

import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import StatCard from "@/components/dashboard/StatCard";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";
import { Building2, Layers, Users, Pencil, Trash2, Plus } from "lucide-react";
import useDepartments from "@/hooks/useDepartments";

const ITEMS_PER_PAGE = 9;

export default function DepartmentsPage() {
  const { addToast } = useToast();
  const { departments, options, loading, error, reload } = useDepartments();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  /* Employees per department, so the page shows what each department is used by */
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/data?collection=employees", { cache: "no-store" });
        if (res.ok) setEmployees((await res.json()).data || []);
      } catch {
        /* per-department counts are informational only */
      } finally {
        setEmployeesLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const countsByDepartment = useMemo(() => {
    const map = {};
    for (const emp of employees) {
      const key = String(emp.department || "").trim();
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [employees]);

  const unassigned = useMemo(
    () => employees.filter((e) => !String(e.department || "").trim()).length,
    [employees]
  );

  const visible = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.trim().toLowerCase();
    return departments.filter((d) => String(d.name || "").toLowerCase().includes(q));
  }, [departments, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = visible.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const nameExists = (name, exceptId) =>
    departments.some((d) => String(d.name || "").trim().toLowerCase() === name.toLowerCase() && d.id !== exceptId);

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setFormName(dept.name || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) {
      setFormError("Department name is required.");
      return;
    }
    if (nameExists(name, editing?.id)) {
      setFormError(`"${name}" already exists.`);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/data?id=${editing.id}&collection=departments`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editing, name }),
        });
        if (!res.ok) throw new Error("update failed");
        addToast({ type: "success", title: "Department Updated", message: `${name} has been updated.` });
      } else {
        const res = await fetch("/api/data?collection=departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, order: departments.length + 1 }),
        });
        if (!res.ok) throw new Error("create failed");
        addToast({ type: "success", title: "Department Added", message: `${name} is now available when adding or editing an employee.` });
      }
      setIsModalOpen(false);
      setEditing(null);
      await reload();
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save department." });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const inUse = countsByDepartment[deleting.name] || 0;
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=departments`, { method: "DELETE" });
       if (!res.ok) throw new Error("delete failed");
       setShowDeleteModal(false);
      setDeleting(null);
      addToast({
        type: "success",
        title: "Department Deleted",
        message: inUse > 0
          ? `${deleting.name} was removed. ${inUse} employee${inUse === 1 ? "" : "s"} keep the name on their record.`
          : `${deleting.name} has been removed.`,
      });
      await reload();
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete department." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <PageContainer
      title="Departments"
      breadcrumb={<><span>Employee Management</span><span aria-hidden="true">/</span><span>Departments</span></>}
      actions={<Button variant="primary" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Department</Button>}
    >
      <section aria-label="Department statistics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Departments" value={departments.length.toLocaleString()} icon={<Layers className="h-5 w-5" aria-hidden="true" />} variant="info" />
          <StatCard title="Departments In Use" value={Object.keys(countsByDepartment).length.toLocaleString()} icon={<Users className="h-5 w-5" aria-hidden="true" />} variant="success" />
          <StatCard title="Managed Here" value="Departments" icon={<Building2 className="h-5 w-5" aria-hidden="true" />} variant="warning" />
        </div>
      </section>

      <section aria-label="Departments" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Departments</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{visible.length} department{visible.length === 1 ? "" : "s"} · used when adding or editing an employee</p>
            </div>
            <Input placeholder="Search departments..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search departments" />
            {/* <Button variant="primary" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Department</Button> */}
          </div>

          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={4} height={96} /></div>
          ) : error ? (
            <div className="px-4 pb-4">
              <ErrorState title="Failed to load departments" description="Unable to load departments from the database." onRetry={reload} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-4 pb-6 text-center">
              <Building2 className="h-7 w-7 mx-auto text-[var(--color-ink-3)] mb-2" aria-hidden="true" />
              <p className="text-sm text-[var(--color-ink-2)]">
                {departments.length === 0 ? "No departments yet." : "No departments match your search."}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {departments.length === 0 ? "Add your first department" : "Add Department"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-5 pb-4">
              {paginated.map((dept) => {
                const inUse = countsByDepartment[dept.name] || 0;
                return (
                  <div key={dept.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--color-ink)] truncate">{dept.name}</h3>
                      <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5">
                        {employeesLoading ? "Counting employees…" : `${inUse} employee${inUse === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={inUse > 0 ? "active" : "unpaid"}>{inUse > 0 ? "In use" : "Unused"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(dept)} aria-label={`Edit ${dept.name}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(dept); setShowDeleteModal(true); }} aria-label={`Delete ${dept.name}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && unassigned > 0 && (
            <p className="px-4 sm:px-5 pb-4 text-xs text-[var(--color-ink-3)]">
              {unassigned} employee{unassigned === 1 ? " has" : "s have"} no department assigned.
            </p>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? "Edit Department" : "Add Department"}
        footer={<><Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{editing ? "Save Changes" : "Create Department"}</Button></>}>
        <div className="space-y-3">
          {formError && (
            <p className="text-xs font-medium text-[var(--color-error)] bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 rounded-lg px-3 py-2" role="alert">{formError}</p>
          )}
          <FormField label="Department Name" required id="dept-name">
            <Input id="dept-name" placeholder="e.g. Operations" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </FormField>
          <p className="text-[11px] text-[var(--color-ink-3)]">Departments appear as selectable options when adding or editing an employee.</p>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Department"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">
          Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
          {(countsByDepartment[deleting?.name] || 0) > 0 && (
            <span className="block mt-2 text-xs text-[var(--color-ink-3)]">
              {countsByDepartment[deleting.name]} employee{countsByDepartment[deleting.name] === 1 ? "" : "s"} in this department will keep the name on their record.
            </span>
          )}
        </p>
      </Modal>
    </PageContainer>
  );
}
