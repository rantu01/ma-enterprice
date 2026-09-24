"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import { useToast } from "@/components/contexts/ToastContext";
import { Settings, Bell, Shield, User, Save, Mail, Push } from "lucide-react";

const notificationOptions = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push Notification" },
  { value: "none", label: "None" },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    addToast({ type: "success", title: "Success", message: "Settings saved successfully." });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <PageContainer title="Settings" breadcrumb={<nav aria-label="Breadcrumb"><span>Settings</span></nav>}>
      <section aria-label="General settings">
        <Card>
          <FormSection title="General Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Company Name" id="company-name">
                <Input placeholder="MAA Enterprise" />
              </FormField>
              <FormField label="Email Address" id="email">
                <Input type="email" placeholder="admin@maaenterprise.com" />
              </FormField>
              <FormField label="Phone Number" id="phone">
                <Input type="tel" placeholder="+1 (555) 000-0000" />
              </FormField>
              <FormField label="Timezone" id="timezone">
                <Select options={[{ value: "est", label: "Eastern Time" }, { value: "cst", label: "Central Time" }, { value: "pst", label: "Pacific Time" }, { value: "gmt", label: "GMT" }]} placeholder="Select timezone" />
              </FormField>
              <FormField label="Language" id="language">
                <Select options={[{ value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" }]} placeholder="Select language" />
              </FormField>
              <FormField label="Date Format" id="date-format">
                <Select options={[{ value: "mm/dd/yyyy", label: "MM/DD/YYYY" }, { value: "dd/mm/yyyy", label: "DD/MM/YYYY" }, { value: "yyyy-mm-dd", label: "YYYY-MM-DD" }]} placeholder="Select format" />
              </FormField>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Notification preferences" className="mt-6">
        <Card>
          <FormSection title="Notification Preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email Notifications" id="email-notifications">
                <Select options={notificationOptions} placeholder="Select notification method" />
              </FormField>
              <FormField label="SMS Notifications" id="sms-notifications">
                <Select options={notificationOptions} placeholder="Select notification method" />
              </FormField>
              <FormField label="Push Notifications" id="push-notifications">
                <Select options={notificationOptions} placeholder="Select notification method" />
              </FormField>
              <FormField label="Report Alerts" id="report-alerts">
                <Select options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} placeholder="Select frequency" />
              </FormField>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Account settings" className="mt-6">
        <Card>
          <FormSection title="Account Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" id="full-name">
                <Input placeholder="John Doe" />
              </FormField>
              <FormField label="Role" id="role">
                <Select options={[{ value: "admin", label: "Admin" }, { value: "manager", label: "Manager" }, { value: "viewer", label: "Viewer" }]} placeholder="Select role" />
              </FormField>
              <FormField label="Current Password" id="current-password">
                <Input type="password" placeholder="Enter current password" />
              </FormField>
              <FormField label="New Password" id="new-password">
                <Input type="password" placeholder="Enter new password" />
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
          <Button variant="primary" onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            Save Changes
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}