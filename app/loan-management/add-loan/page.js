"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

export default function AddLoanPage() {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const terms = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "semi-annual", label: "Semi-Annual" },
    { value: "annual", label: "Annual" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=organizations");
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data.data || []);
        }
      } catch {}
    }
    fetchData();
  }, []);

  const orgOptions = [
    { value: "", label: "Select an organization" },
    ...organizations.map((org) => ({ value: org.name, label: `${org.name}` })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(false);
    setFormSuccess(false);
    try {
      const orgName = e.target["loan-org"].value;
      const res = await fetch("/api/data?collection=loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizations.find((o) => o.name === orgName)?._id || orgName,
          organizationName: orgName,
          amount: parseFloat(e.target["loan-amount"].value) || 0,
          interestRate: parseFloat(e.target["loan-rate"].value) || 0,
          term: parseInt(e.target["loan-term"].value) || 12,
          status: "active",
          startDate: e.target["loan-start"].value,
          dueDate: e.target["loan-due"].value,
        }),
      });
      if (res.ok) {
        setFormSuccess(true);
        addToast({ type: "success", title: "Loan Added", message: "Loan application has been created successfully." });
      } else {
        setFormError(true);
      }
    } catch {
      setFormError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formSuccess) {
    return (
      <PageContainer title="Add Loan">
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-success)]" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          title="Loan added successfully"
          description="The new loan application has been created and is pending review."
          action={<Button variant="primary" onClick={() => setFormSuccess(false)}>Add Another Loan</Button>}
        />
      </PageContainer>
    );
  }

  if (formError) {
    return (
      <PageContainer title="Add Loan">
        <ErrorState
          title="Failed to add loan"
          description="Something went wrong while creating the loan application. Please try again."
          onRetry={() => setFormError(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Add Loan"
      breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Add Loan</span></>}
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <FormSection title="Loan Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Organization" required id="loan-org">
                <Select
                  options={orgOptions}
                  placeholder="Select an organization"
                  required
                  id="loan-org"
                />
              </FormField>
              <FormField label="Loan Amount ($)" required id="loan-amount">
                <Input id="loan-amount" type="number" placeholder="0.00" required min="0" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Interest Rate (%)" required id="loan-rate">
                <Input id="loan-rate" type="number" step="0.01" placeholder="0.00" required min="0" />
              </FormField>
              <FormField label="Loan Term (months)" required id="loan-term">
                <Input id="loan-term" type="number" placeholder="12" required min="1" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start Date" required id="loan-start">
                <Input id="loan-start" type="date" required />
              </FormField>
              <FormField label="Due Date" required id="loan-due">
                <Input id="loan-due" type="date" required />
              </FormField>
            </div>
            <FormField label="Payment Frequency" required id="loan-frequency">
              <Select options={terms} placeholder="Select payment frequency" required id="loan-frequency" />
            </FormField>
          </FormSection>
        </Card>

        <Card>
          <FormSection title="Payment Terms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Principal Amount ($)" id="payment-principal">
                <Input id="payment-principal" type="number" placeholder="0.00" min="0" />
              </FormField>
              <FormField label="Down Payment ($)" id="payment-down">
                <Input id="payment-down" type="number" placeholder="0.00" min="0" />
              </FormField>
            </div>
            <FormField label="Notes" id="payment-notes">
              <Textarea id="payment-notes" placeholder="Additional payment notes..." />
            </FormField>
          </FormSection>
        </Card>

        <nav aria-label="Form actions" className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => { setFormSuccess(false); setFormError(false); }}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Loan Application"}
          </Button>
        </nav>
      </form>
    </PageContainer>
  );
}