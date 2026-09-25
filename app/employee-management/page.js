"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/ui/DataTable";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
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

export default function EmployeeManagementPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const itemsPerPage = 8;

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

  const kpis = useMemo(() => {
    const activeCount = employees.filter((e) => e.status === "Active").length;
    const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const recentHires = employees.filter((e) => {
      const d = new Date(e.hireDate);
      const now = new Date();
      const diff = (now - d) / (1000 * 60 * 60 * 24 * 30);
      return diff < 3;
    }).length;

    return [
      { title: "Total Employees", value: employees.length.toLocaleString(), trend: "+12%", trendLabel: "vs last month", variant: "default", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { title: "Active Employees", value: activeCount.toLocaleString(), trend: "+8%", trendLabel: "vs last month", variant: "success", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
      { title: "Monthly Salary Total", value: `$${(totalSalary / 1000).toFixed(0)}K`, trend: "+3.2%", trendLabel: "vs last month", variant: "warning", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
      { title: "Recent Hires", value: recentHires.toString(), trend: "5 this week", trendLabel: "new employees", variant: "info", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
    ];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        String(e.name || "").toLowerCase().includes(q) ||
        String(e.email || "").toLowerCase().includes(q) ||
        String(e.department || "").toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = filteredEmployees.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const handleEditClick = (employee) => {
    setEditingEmployee({ ...employee });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/data?id=${editingEmployee.id}&collection=employees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee),
      });
      if (res.ok) {
        setEmployees((prev) => prev.map((e) => (e.id === editingEmployee.id ? editingEmployee : e)));
        setShowEditModal(false);
        setEditingEmployee(null);
        addToast({ type: "success", title: "Employee Updated", message: "Employee has been updated." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to update employee." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    }
  };

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/data?id=${selectedEmployee.id}&collection=employees`, { method: "DELETE" });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        addToast({ type: "success", title: "Employee Deleted", message: "Employee has been removed." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to delete employee." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    }
  };

  const columns = [
    { key: "name", label: "Name", accessor: "name", sortable: true, minWidth: "180px", render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="h-[32px] w-[32px] rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-[0.75rem] font-semibold" aria-hidden="true">
          {String(val || "?").charAt(0)}
        </div>
        <span className="font-medium text-[var(--color-ink)]">{val}</span>
      </div>
    )},
    { key: "email", label: "Email", accessor: "email", sortable: true, minWidth: "200px" },
    { key: "department", label: "Department", accessor: "department", sortable: true, minWidth: "140px" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "120px", render: (val) => (
      <Badge variant={statusVariantMap[val] || "info"}>{val}</Badge>
    )},
    { key: "actions", label: "Actions", accessor: "id", minWidth: "150px", render: (id, row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => handleDeleteClick(row)}>
          Delete
        </Button>
      </div>
    )},
  ];

  const handleSearch = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  return (
    <PageContainer title="Employee Management">
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><Skeleton height={96} /></Card>
            ))
          ) : error ? (
            <ErrorState title="Failed to load KPIs" description="Unable to load employee statistics. Please try again." onRetry={() => window.location.reload()} />
          ) : (
            kpis.map((kpi) => <StatCard key={kpi.title} {...kpi} />)
          )}
        </div>
      </section>

      <section aria-label="Recent Employees">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">Recent Employees</h2>
            <Button variant="outline" size="sm">Export</Button>
          </div>
          {loading ? (
            <Skeleton count={5} height={48} className="w-full" />
          ) : error ? (
            <ErrorState title="Failed to load employees" description="Unable to load employee data. Please try again." onRetry={() => window.location.reload()} />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} title="No employees found" description="No employees match your search criteria." action={<Button variant="outline" size="sm">Clear Filters</Button>} />
          ) : (
            <DataTable
              columns={columns}
              data={paginatedEmployees}
              toolbar={[
                <Input key="search" placeholder="Search employees..." value={searchQuery} onChange={handleSearch} className="w-64" aria-label="Search employees" />,
                <Select key="filter" options={[{ value: "", label: "All Departments" }, ...departmentOptions]} defaultValue="" onChange={() => {}} className="w-44" aria-label="Filter by department" />,
              ]}
              pagination={{
                currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filteredEmployees.length, itemsPerPage,
              }}
            />
          )}
        </Card>
      </section>

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
        {editingEmployee && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Name</label>
              <Input value={editingEmployee.name || ""} onChange={(e) => setEditingEmployee((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Email</label>
              <Input value={editingEmployee.email || ""} onChange={(e) => setEditingEmployee((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Department</label>
              <Select options={departmentOptions} value={editingEmployee.department} onChange={(e) => setEditingEmployee((p) => ({ ...p, department: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Status</label>
              <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "On Leave", label: "On Leave" }, { value: "Probation", label: "Probation" }]} value={editingEmployee.status} onChange={(e) => setEditingEmployee((p) => ({ ...p, status: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>

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
        <p className="text-sm text-[var(--color-ink-2)]">
          Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
}