"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/contexts/ToastContext";

export default function AddOrganizationPage() {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [organizations, setOrganizations] = useState([]);

  const orgTypes = [
    { value: "corporation", label: "Corporation" },
    { value: "llc", label: "Limited Liability Company" },
    { value: "partnership", label: "Partnership" },
    { value: "nonprofit", label: "Non-Profit Organization" },
    { value: "sole_proprietorship", label: "Sole Proprietorship" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(false);
    setFormSuccess(false);
    try {
      const res = await fetch("/api/data?collection=organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: e.target["org-name"].value,
          type: selectedType,
          contactPerson: e.target["org-contact"].value,
          email: e.target["org-email"].value,
          phone: e.target["org-phone"].value,
          address: e.target["org-address"].value,
          description: e.target["org-description"].value,
          status: "active",
        }),
      });
      if (res.ok) {
        setFormSuccess(true);
        const data = await res.json();
        setOrganizations((prev) => [data.data, ...prev]);
        addToast({ type: "success", title: "Organization Added", message: `${e.target["org-name"].value} has been added successfully.` });
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
      <PageContainer title="Add Organization">
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-success)]" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          title="Organization added successfully"
          description="The new organization has been created and is pending review."
          action={<Button variant="primary" onClick={() => setFormSuccess(false)}>Add Another Organization</Button>}
        />
      </PageContainer>
    );
  }

  if (formError) {
    return (
      <PageContainer title="Add Organization">
        <ErrorState
          title="Failed to add organization"
          description="Something went wrong while creating the organization. Please try again."
          onRetry={() => setFormError(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Add Organization"
      breadcrumb={<><span>Loan Management</span><span aria-hidden="true">/</span><span>Add Organization</span></>}
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <FormSection title="Organization Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Organization Name" required id="org-name">
                <Input id="org-name" placeholder="Enter organization name" required />
              </FormField>
              <FormField label="Organization Type" required id="org-type">
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  options={orgTypes}
                  placeholder="Select organization type"
                  required
                  id="org-type"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Address" required id="org-address">
                <Input id="org-address" placeholder="123 Business Ave, Suite 100" required />
              </FormField>
              <FormField label="Contact Person" required id="org-contact">
                <Input id="org-contact" placeholder="Full name of contact person" required />
              </FormField>
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection title="Contact Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email" required id="org-email">
                <Input id="org-email" type="email" placeholder="contact@organization.com" required />
              </FormField>
              <FormField label="Phone" required id="org-phone">
                <Input id="org-phone" type="tel" placeholder="+1 (555) 000-0000" required />
              </FormField>
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection title="Description">
            <FormField label="Description" id="org-description">
              <Textarea id="org-description" placeholder="Brief description of the organization..." rows={4} />
            </FormField>
          </FormSection>
        </Card>

        <nav aria-label="Form actions" className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => { setFormSuccess(false); setFormError(false); }}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Add Organization"}
          </Button>
        </nav>
      </form>
    </PageContainer>
  );
}