"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

const depositStatusMap = {
  completed: "completed",
  pending: "pending",
  processing: "processing",
};

const depositTypeOptions = [
  { value: "savings", label: "Savings Account" },
  { value: "checking", label: "Checking Account" },
  { value: "fixed", label: "Fixed Deposit" },
  { value: "recurring", label: "Recurring Deposit" },
];

export default function CompanyDepositPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [formData, setFormData] = useState({ type: "", amount: "", description: "" });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=deposits");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setDeposits(data.data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => { setShowModal(false); setFormData({ type: "", amount: "", description: "" }); setFormErrors({}); };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = "Please select a deposit type.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0.";
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDeposit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date().toISOString().split("T")[0],
          status: "Processing",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits([data.data, ...deposits]);
        addToast({ type: "success", title: "Deposit Added", message: `Deposit of ${formData.amount} has been recorded.` });
        handleCloseModal();
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add deposit." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "type", label: "Deposit Type", accessor: "type", sortable: true, minWidth: "160px" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "130px", render: (val) => (
      <Badge variant={depositStatusMap[val] || "info"}>{val.charAt(0).toUpperCase() + val.slice(1)}</Badge>
    )},
    { key: "description", label: "Description", accessor: "description", sortable: true, minWidth: "200px" },
  ];

  return (
    <PageContainer
      title="Company Deposit"
      breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span></nav>}
      actions={<Button onClick={handleOpenModal}>New Deposit</Button>}
    >
      <section aria-label="Company deposit records" className="space-y-6">
        <Card>
          <h2 className="text-[18px] font-semibold text-[var(--color-ink)] mb-4">Deposit History</h2>
          {loading ? (
            <Skeleton count={5} height={48} className="w-full" />
          ) : error ? (
            <ErrorState title="Failed to load deposits" description="Unable to load deposit records." onRetry={() => window.location.reload()} />
          ) : deposits.length === 0 ? (
            <EmptyState icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} title="No deposits found" description="No company deposits recorded yet." action={<Button variant="outline" size="sm" onClick={handleOpenModal}>Add Deposit</Button>} />
          ) : (
            <table className="w-full" role="table">
              <thead>
                <tr className="bg-[var(--color-base)] border-b border-[var(--color-line)]">
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)] text-left">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => (
                  <tr key={dep.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-hover)] transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-[13px] text-[var(--color-ink)]">
                        {col.render ? col.render(dep[col.accessor], dep) : dep[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Add Company Deposit"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleAddDeposit} loading={submitting}>Add Deposit</Button>
          </>
        }
      >
        <FormSection title="Deposit Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Deposit Type" error={formErrors.type} id="deposit-type" required>
              <Select options={depositTypeOptions} value={formData.type} onChange={(e) => handleChange("type", e.target.value)} placeholder="Select type" error={!!formErrors.type} />
            </FormField>
            <FormField label="Amount" error={formErrors.amount} id="deposit-amount" required>
              <Input id="deposit-amount" type="number" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!formErrors.amount} required />
            </FormField>
          </div>
          <FormField label="Description" id="deposit-description">
            <Textarea id="deposit-description" placeholder="Enter deposit description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
          </FormField>
        </FormSection>
      </Modal>
    </PageContainer>
  );
}