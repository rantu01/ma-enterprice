"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import { Settings, Plus, Trash2, Edit2 } from "lucide-react";

export default function OfficeExpenseSettings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=expenses");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch {}
    }
    fetchData();
  }, []);

  const budgetTypes = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
  ];

  const notificationOptions = [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "push", label: "Push Notification" },
  ];

  const handleToggleCategory = (index) => {
    const updated = [...categories];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "Active" ? "Inactive" : "Active",
    };
    setCategories(updated);
    addToast({ type: "info", title: "Updated", message: `Category status updated.` });
  };

  const handleAddCategory = async () => {
    try {
      const res = await fetch("/api/data?collection=expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "New Category",
          amount: 0,
          month: "New",
          status: "Active",
          notes: "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [data.data, ...prev]);
        addToast({ type: "success", title: "Added", message: "New category added." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to add category." });
    }
  };

  return (
    <PageContainer title="Office Expense Settings" breadcrumb={<nav aria-label="Breadcrumb"><span>Office Expense</span><span>/</span><span>Settings</span></nav>}>
      <section aria-label="Expense categories management">
        <Card>
          <FormSection title="Expense Categories">
            <div className="flex flex-col gap-3">
              {categories.map((cat, index) => (
                <div key={cat.id || index} className="flex items-center justify-between p-4 border border-[var(--color-line)] rounded-lg hover:bg-[var(--color-hover)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-[40px] h-[40px] rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center" aria-hidden="true">
                      <Settings className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[0.875rem] font-medium text-[var(--color-ink)]">{cat.category}</p>
                      <p className="text-[0.75rem] text-[var(--color-ink-3)]">Budget: ${(cat.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cat.status === "Active" ? "active" : "cancelled"}>{cat.status}</Badge>
                    <button
                      onClick={() => handleToggleCategory(index)}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
                      aria-label={`Toggle ${cat.category} status`}
                      type="button"
                    >
                      <Edit2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-error)] focus-visible:outline-offset-2"
                      aria-label={`Delete ${cat.category}`}
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/data?id=${cat.id}&collection=expenses`, { method: "DELETE" });
                          if (res.ok) {
                            setCategories(categories.filter((_, i) => i !== index));
                            addToast({ type: "success", title: "Deleted", message: `${cat.category} has been deleted.` });
                          }
                        } catch {
                          addToast({ type: "error", title: "Error", message: "Failed to delete category." });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button variant="outline" size="sm" aria-label="Add new expense category" onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Category
              </Button>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Configuration options" className="mt-6">
        <Card>
          <FormSection title="Configuration Options">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Budget Type" id="budget-type">
                <Select options={budgetTypes} placeholder="Select budget type" />
              </FormField>
              <FormField label="Default Currency" id="currency">
                <Select options={[{ value: "usd", label: "USD" }, { value: "eur", label: "EUR" }, { value: "gbp", label: "GBP" }]} placeholder="Select currency" />
              </FormField>
              <FormField label="Notification Method" id="notification">
                <Select options={notificationOptions} placeholder="Select notification method" />
              </FormField>
              <FormField label="Budget Alert Threshold (%)" id="threshold">
                <Input type="number" placeholder="80" />
              </FormField>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Save settings" className="mt-6">
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => addToast({ type: "info", title: "Cancelled", message: "Changes discarded." })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => addToast({ type: "success", title: "Success", message: "Settings saved successfully." })} loading={loading}>
            Save Settings
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}