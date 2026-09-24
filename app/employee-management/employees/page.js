"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

const statusVariantMap = {
  Active: "active",
  Inactive: "cancelled",
  "On Leave": "warning",
  Probation: "info",
};

const departmentOptions = [
  { value: "Engineering", label: "Engineering" },
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "HR", label: "HR" },
  { value: "Design", label: "Design" },
  { value: "Operations", label: "Operations" },
];

export default function EmployeesPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const itemsPerPage = 5;

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=employees");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setEmployees(data.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    if (departmentFilter) result = result.filter((e) => e.department === departmentFilter);
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    return result;
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/data?id=${selectedEmployee.id}&collection=employees`, { method: "DELETE" });
      if (res.ok) {
        setEmployees(employees.filter((e) => e.id !== selectedEmployee.id));
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        addToast({ type: "success", title: "Employee Deleted", message: `${selectedEmployee.name} has been removed.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to delete employee." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    }
  };

  const handleEditClick = (employee) => {
    setEditingEmployee({ ...employee });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditingEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/data?id=${editingEmployee.id}&collection=employees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee),
      });
      if (res.ok) {
        setEmployees(employees.map((e) => (e.id === editingEmployee.id ? editingEmployee : e)));
        setShowEditModal(false);
        setEditingEmployee(null);
        addToast({ type: "success", title: "Employee Updated", message: `${editingEmployee.name} has been updated.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to update employee." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    }
  };

  const columns = [
    { key: "name", label: "Name", accessor: "name", sortable: true, minWidth: "180px", render: (val) => (
      <div className="flex items-center gap-3">
        <div className="h-[32px] w-[32px] rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-[0.75rem] font-semibold" aria-hidden="true">
          {val.charAt(0)}
        </div>
        <span className="font-medium text-[var(--color-ink)]">{val}</span>
      </div>
    )},
    { key: "email", label: "Email", accessor: "email", sortable: true, minWidth: "200px" },
    { key: "department", label: "Department", accessor: "department", sortable: true, minWidth: "140px" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "120px", render: (val) => (
      <Badge variant={statusVariantMap[val] || "info"}>{val}</Badge>
    )},
    { key: "actions", label: "Actions", accessor: "id", minWidth: "120px", render: (id, row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => handleDeleteClick(row)}>Delete</Button>
      </div>
    )},
  ];

  return (
    <PageContainer
      title="Employees"
      actions={<Button onClick={() => addToast({ type: "info", title: "Add Employee", message: "Use the form to add new employees." })}>Add Employee</Button>}
    >
      <section aria-label="Employees list">
        <Card>
          <DataTable
            columns={columns}
            data={paginatedEmployees}
            toolbar={[
              <Input key="search" placeholder="Search employees..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-64" aria-label="Search employees" />,
              <Select key="dept" options={[{ value: "", label: "All Departments" }, ...departmentOptions]} value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }} placeholder="All Departments" className="w-44" aria-label="Filter by department" />,
              <Select key="status" options={[{ value: "", label: "All Statuses" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "On Leave", label: "On Leave" }, { value: "Probation", label: "Probation" }]} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} placeholder="All Statuses" className="w-44" aria-label="Filter by status" />,
            ]}
            pagination={{
              currentPage, totalPages, onPageChange: setCurrentPage, totalItems: filteredEmployees.length, itemsPerPage, showingText: `Showing ${paginatedEmployees.length} of ${filteredEmployees.length} employees`,
            }}
            loading={loading}
            emptyMessage="No employees found matching your criteria."
          />
        </Card>
      </section>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}
        title="Delete Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Delete</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-[40px] w-[40px] rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)] flex items-center justify-center" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-[0.875rem] text-[var(--color-ink-2)]">
              Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingEmployee(null); }}
        title="Edit Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">Name</label>
            <Input value={editingEmployee?.name || ""} onChange={(e) => handleEditChange("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">Email</label>
            <Input value={editingEmployee?.email || ""} onChange={(e) => handleEditChange("email", e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">Department</label>
            <Select options={departmentOptions} value={editingEmployee?.department} onChange={(e) => handleEditChange("department", e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.875rem] font-medium text-[var(--color-ink)] mb-1">Status</label>
            <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "On Leave", label: "On Leave" }, { value: "Probation", label: "Probation" }]} value={editingEmployee?.status} onChange={(e) => handleEditChange("status", e.target.value)} />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}