"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/contexts/ToastContext";

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

export default function AddInvestmentPage() {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    date: "",
    status: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Investment name is required.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0.";
    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.status) newErrors.status = "Please select a status.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      if (res.ok) {
        addToast({ type: "success", title: "Investment Added", message: `${formData.name} has been added successfully.` });
        setFormData({ name: "", amount: "", category: "", date: "", status: "", notes: "" });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add investment." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Add Investment" breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span><span aria-hidden="true">/</span><span>Add Investment</span></nav>}>
      <section aria-label="Add investment form">
        <Card className="max-w-3xl">
          <form onSubmit={handleSubmit} noValidate>
            <FormSection title="Investment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Investment Name" error={errors.name} id="investment-name" required>
                  <Input id="investment-name" placeholder="Enter investment name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} error={!!errors.name} required />
                </FormField>
                <FormField label="Amount" error={errors.amount} id="investment-amount" required>
                  <Input id="investment-amount" type="number" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!errors.amount} required />
                </FormField>
                <FormField label="Category" error={errors.category} id="investment-category" required>
                  <Select options={categoryOptions} value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="Select category" error={!!errors.category} />
                </FormField>
                <FormField label="Date" error={errors.date} id="investment-date" required>
                  <Input id="investment-date" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} error={!!errors.date} required />
                </FormField>
                <FormField label="Status" error={errors.status} id="investment-status" required>
                  <Select options={statusOptions} value={formData.status} onChange={(e) => handleChange("status", e.target.value)} placeholder="Select status" error={!!errors.status} />
                </FormField>
                <FormField label="Notes" id="investment-notes">
                  <Textarea id="investment-notes" placeholder="Enter additional notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
                </FormField>
              </div>
            </FormSection>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => { setFormData({ name: "", amount: "", category: "", date: "", status: "", notes: "" }); setErrors({}); }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Add Investment</Button>
            </div>
          </form>
        </Card>
      </section>
    </PageContainer>
  );
}