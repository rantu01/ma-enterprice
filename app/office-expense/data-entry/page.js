"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import DataTable from "@/components/ui/DataTable";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import { FileText, Plus, Calendar } from "lucide-react";

const expenseCategories = [
  { value: "office-supplies", label: "Office Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Software" },
  { value: "furniture", label: "Furniture" },
  { value: "travel", label: "Travel" },
  { value: "communications", label: "Communications" },
  { value: "other", label: "Other" },
];

export default function DataEntryPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amounts, setAmounts] = useState({});
  const [notes, setNotes] = useState("");
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=expenses");
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.data || []);
        }
      } catch {}
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const categoryKeys = Object.keys(amounts);
      for (const cat of categoryKeys) {
        if (amounts[cat]) {
          const res = await fetch("/api/data?collection=expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              amount: parseFloat(amounts[cat]),
              month: selectedMonth.replace(/-/g, " "),
              status: "Pending",
              notes: notes,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setExpenses((prev) => [data.data, ...prev]);
          }
        }
      }
      addToast({ type: "success", title: "Success", message: "Expense data saved successfully." });
      setSelectedMonth("");
      setAmounts({});
      setNotes("");
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save expense data." });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "category", label: "Category", accessor: "category", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: "month", label: "Month", accessor: "month", sortable: true },
    { key: "status", label: "Status", accessor: "status", render: (val) => <Badge variant={val === "Approved" ? "active" : val === "Pending" ? "pending" : "processing"}>{val}</Badge> },
  ];

  return (
    <PageContainer title="Monthly Data Entry" breadcrumb={<nav aria-label="Breadcrumb"><span>Office Expense</span><span>/</span><span>Monthly Data Entry</span></nav>}>
      <section aria-label="Data entry form">
        <Card>
          <FormSection title="Enter Monthly Expenses">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Select Month" id="month" required>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  options={[
                    { value: "january-2024", label: "January 2024" },
                    { value: "february-2024", label: "February 2024" },
                    { value: "march-2024", label: "March 2024" },
                    { value: "april-2024", label: "April 2024" },
                    { value: "may-2024", label: "May 2024" },
                    { value: "june-2024", label: "June 2024" },
                  ]}
                  placeholder="Choose a month"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h4 className="text-[14px] font-semibold text-[var(--color-ink)] col-span-2 mt-2">Expense Categories</h4>
              {expenseCategories.map((cat) => (
                <FormField key={cat.value} label={cat.label} id={cat.value}>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amounts[cat.value] || ""}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [cat.value]: e.target.value }))}
                  />
                </FormField>
              ))}
            </div>

            <FormField label="Notes" id="notes">
              <Textarea
                placeholder="Add any notes about these expenses..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" onClick={handleSave} loading={loading} aria-label="Save expense data">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Save
              </Button>
              <Button variant="secondary" onClick={() => { setSelectedMonth(""); setAmounts({}); setNotes(""); }} aria-label="Clear form">
                Clear
              </Button>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Existing expenses" className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">Existing Expenses</h3>
          </div>
          <DataTable
            columns={columns}
            data={expenses}
            emptyMessage="No expenses recorded yet."
          />
        </Card>
      </section>
    </PageContainer>
  );
}