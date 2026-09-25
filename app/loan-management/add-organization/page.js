"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { Building2, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const orgTypes = [
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "Limited Liability Company" },
  { value: "partnership", label: "Partnership" },
  { value: "nonprofit", label: "Non-Profit Organization" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
];

const orgTypeLabel = (v) => orgTypes.find((t) => t.value === v)?.label || v || "—";

const emptyForm = {
  name: "",
  type: "",
  address: "",
  contactPerson: "",
  email: "",
  phone: "",
  description: "",
};

export default function AddOrganizationPage() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
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
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/data?collection=organizations", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data.data || []);
        }
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load organizations." });
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, [addToast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.type) {
      addToast({ type: "warning", title: "Missing information", message: "Organization name and type are required." });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "active" }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations((prev) => [data.data, ...prev]);
        setFormData(emptyForm);
        setCurrentPage(1);
        addToast({ type: "success", title: "Organization Added", message: `${data.data.name} has been added successfully.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add organization." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter((o) =>
      [o.name, o.type, o.contactPerson, o.email, o.phone].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [organizations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const openEdit = (row) => {
    setEditing({ ...row });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editing?.name?.trim()) {
      addToast({ type: "warning", title: "Missing information", message: "Organization name is required." });
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=organizations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setOrganizations((prev) => prev.map((o) => (o.id === editing.id ? { ...o, ...updated } : o)));
        setShowEditModal(false);
        setEditing(null);
        addToast({ type: "success", title: "Organization Updated", message: `${updated.name} has been updated.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to update organization." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSavingEdit(false);
    }
  };

  const openDelete = (row) => {
    setDeleting(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=organizations`, { method: "DELETE" });
      if (res.ok) {
        setOrganizations((prev) => prev.filter((o) => o.id !== deleting.id));
        setShowDeleteModal(false);
        setDeleting(null);
        addToast({ type: "success", title: "Organization Deleted", message: "The organization has been removed." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to delete organization." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const columns = [
    {
      key: "name", label: "Organization", accessor: "name", sortable: true, minWidth: "200px",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-ink)] truncate">{val}</p>
            <p className="text-xs text-[var(--color-ink-3)] truncate">{row.email || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "type", label: "Type", accessor: "type", sortable: true, minWidth: "170px", render: (v) => orgTypeLabel(v) },
    { key: "contactPerson", label: "Contact", accessor: "contactPerson", sortable: true, minWidth: "150px", render: (v) => v || "—" },
    { key: "phone", label: "Phone", accessor: "phone", sortable: true, minWidth: "140px", render: (v) => v || "—" },
    {
      key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px",
      render: (v) => <Badge variant={v === "active" ? "active" : "pending"}>{v || "active"}</Badge>,
    },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
            <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
            onClick={() => openDelete(row)}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Add Organization"
      breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Add Organization</span></>}
    >
      {/* Compact form */}
      <section aria-label="Add organization form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Add Organization</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Register a new borrowing organization.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Organization Name" required id="org-name">
                <Input id="org-name" placeholder="e.g. Acme Corp" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </FormField>
              <FormField label="Organization Type" required id="org-type">
                <Select value={formData.type} onChange={(e) => handleChange("type", e.target.value)} options={orgTypes} placeholder="Select type" required id="org-type" />
              </FormField>
              <FormField label="Contact Person" required id="org-contact">
                <Input id="org-contact" placeholder="Full name" value={formData.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)} required />
              </FormField>
              <FormField label="Email" required id="org-email">
                <Input id="org-email" type="email" placeholder="contact@org.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required />
              </FormField>
              <FormField label="Phone" required id="org-phone">
                <Input id="org-phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required />
              </FormField>
              <FormField label="Address" required id="org-address">
                <Input id="org-address" placeholder="Street, City" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} required />
              </FormField>
              <FormField label="Description" id="org-description" className="sm:col-span-2 lg:col-span-3">
                <Textarea id="org-description" placeholder="Brief description (optional)" rows={2} value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setFormData(emptyForm)}>Clear</Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Organization"}
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Existing records */}
      <section aria-label="Existing organizations" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Organizations</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-64"
              aria-label="Search organizations"
            />
          </div>
          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div>
          ) : (
            <DataTable
              columns={columns}
              data={paginated}
              emptyMessage="No organizations found. Add your first organization above."
              pagination={{
                currentPage: safePage,
                totalPages,
                onPageChange: setCurrentPage,
                totalItems: filtered.length,
                itemsPerPage: ITEMS_PER_PAGE,
              }}
            />
          )}
        </Card>
      </section>

      {/* Edit modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditing(null); }}
        title="Edit Organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Organization Name" required id="edit-org-name">
              <Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            </FormField>
            <FormField label="Type" id="edit-org-type">
              <Select options={orgTypes} value={editing.type || ""} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value }))} />
            </FormField>
            <FormField label="Contact Person" id="edit-org-contact">
              <Input value={editing.contactPerson || ""} onChange={(e) => setEditing((p) => ({ ...p, contactPerson: e.target.value }))} />
            </FormField>
            <FormField label="Email" id="edit-org-email">
              <Input value={editing.email || ""} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} />
            </FormField>
            <FormField label="Phone" id="edit-org-phone">
              <Input value={editing.phone || ""} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} />
            </FormField>
            <FormField label="Address" id="edit-org-address">
              <Input value={editing.address || ""} onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))} />
            </FormField>
            <FormField label="Status" id="edit-org-status">
              <Select
                options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "inactive", label: "Inactive" }]}
                value={editing.status || "active"}
                onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}
              />
            </FormField>
            <FormField label="Description" id="edit-org-desc" className="sm:col-span-2">
              <Textarea value={editing.description || ""} rows={2} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} />
            </FormField>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleting(null); }}
        title="Delete Organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-ink-2)]">
          Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
}
