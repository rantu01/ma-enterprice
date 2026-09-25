"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/forms/FormField";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { Route as RouteIcon, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const vehicleTypes = [
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
];

const emptyForm = { route: "", vehicle: "", distance: "", cost: "", date: "", notes: "" };

export default function AddRouteCostPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [routes, setRoutes] = useState([]);
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
        const res = await fetch("/api/data?collection=routes", { cache: "no-store" });
        if (res.ok) setRoutes((await res.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load routes." });
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [addToast]);

  const handleChange = (f, v) => setFormData((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.route.trim() || !formData.cost) {
      addToast({ type: "warning", title: "Missing information", message: "Route name and cost are required." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/data?collection=routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: formData.route,
          vehicle: formData.vehicle || "Truck",
          distance: parseFloat(formData.distance) || 0,
          cost: parseFloat(formData.cost) || 0,
          date: formData.date || new Date().toISOString().split("T")[0],
          notes: formData.notes,
          status: "Active",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes((prev) => [data.data, ...prev]);
        setFormData(emptyForm);
        setCurrentPage(1);
        addToast({ type: "success", title: "Success", message: "Route cost added successfully." });
      } else addToast({ type: "error", title: "Error", message: "Failed to add route cost." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter((r) => [r.route, r.vehicle, r.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [routes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=routes`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setRoutes((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Success", message: "Route cost updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update route." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=routes`, { method: "DELETE" });
      if (res.ok) {
        setRoutes((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Deleted", message: "Route cost has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete route." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    { key: "route", label: "Route", accessor: "route", sortable: true, minWidth: "200px", render: (v) => v || "—" },
    { key: "vehicle", label: "Vehicle", accessor: "vehicle", sortable: true, minWidth: "110px", render: (v) => v || "—" },
    { key: "distance", label: "Distance", accessor: "distance", sortable: true, minWidth: "110px", render: (v) => `${v ?? "—"} km` },
    { key: "cost", label: "Cost", accessor: "cost", sortable: true, minWidth: "110px", render: (v) => `$${(Number(v) || 0).toLocaleString()}` },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px", render: (v) => <Badge variant={v === "Active" ? "active" : "pending"}>{v || "—"}</Badge> },
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
    <PageContainer title="Add Route Cost" breadcrumb={<nav aria-label="Breadcrumb"><span>Route Calculation</span><span aria-hidden="true">/</span><span>Add Route Cost</span></nav>}>
      <section aria-label="Add route cost form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <RouteIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Add Route Cost</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Record the cost of a new route.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Route Name" id="route-name" required>
                <Input id="route-name" placeholder="e.g. Warehouse A → Store 1" value={formData.route} onChange={(e) => handleChange("route", e.target.value)} required />
              </FormField>
              <FormField label="Vehicle Type" id="vehicle-type" required>
                <Select options={vehicleTypes} placeholder="Select vehicle" value={formData.vehicle} onChange={(e) => handleChange("vehicle", e.target.value)} />
              </FormField>
              <FormField label="Distance (km)" id="distance">
                <Input id="distance" type="number" placeholder="e.g. 120" value={formData.distance} onChange={(e) => handleChange("distance", e.target.value)} min="0" />
              </FormField>
              <FormField label="Cost ($)" id="cost" required>
                <Input id="cost" type="number" placeholder="e.g. 500" value={formData.cost} onChange={(e) => handleChange("cost", e.target.value)} required min="0" />
              </FormField>
              <FormField label="Date" id="date">
                <Input id="date" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} />
              </FormField>
              <FormField label="Notes" id="notes">
                <Input id="notes" placeholder="Optional notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setFormData(emptyForm)}>Clear</Button>
              <Button variant="primary" size="sm" type="submit" loading={loading}>Save Route Cost</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Existing route costs" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Route Costs</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search routes..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search routes" />
          </div>
          {fetching ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No route costs found. Add your first route above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Route Cost"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Route" id="edit-route"><Input value={editing.route || ""} onChange={(e) => setEditing((p) => ({ ...p, route: e.target.value }))} /></FormField>
            <FormField label="Vehicle" id="edit-vehicle"><Select options={vehicleTypes} value={String(editing.vehicle || "").toLowerCase()} onChange={(e) => setEditing((p) => ({ ...p, vehicle: e.target.value }))} /></FormField>
            <FormField label="Distance" id="edit-distance"><Input type="number" value={editing.distance || ""} onChange={(e) => setEditing((p) => ({ ...p, distance: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Cost" id="edit-cost"><Input type="number" value={editing.cost || ""} onChange={(e) => setEditing((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Status" id="edit-status">
              <Select options={[{ value: "Active", label: "Active" }, { value: "Completed", label: "Completed" }, { value: "Pending", label: "Pending" }]} value={editing.status || "Active"} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} />
            </FormField>
            <FormField label="Notes" id="edit-notes"><Input value={editing.notes || ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Route Cost"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete route <strong>{deleting?.route}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
