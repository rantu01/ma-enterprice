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
import { Settings, Calculator, MapPin, Clock } from "lucide-react";

export default function RouteCalculationSettings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    addToast({ type: "success", title: "Success", message: "Route calculation settings saved." });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <PageContainer title="Route Calculation Settings" breadcrumb={<nav aria-label="Breadcrumb"><span>Route Calculation</span><span>/</span><span>Settings</span></nav>}>
      <section aria-label="Route calculation configuration">
        <Card>
          <FormSection title="Route Calculation Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Default Algorithm" id="algorithm">
                <Select options={[{ value: "shortest", label: "Shortest Path" }, { value: "fastest", label: "Fastest Route" }, { value: "economical", label: "Most Economical" }, { value: "balanced", label: "Balanced" }]} placeholder="Select algorithm" />
              </FormField>
              <FormField label="Default Vehicle Type" id="vehicle">
                <Select options={[{ value: "truck", label: "Truck" }, { value: "van", label: "Van" }, { value: "bike", label: "Bike" }, { value: "car", label: "Car" }]} placeholder="Select vehicle type" />
              </FormField>
              <FormField label="Fuel Type" id="fuel">
                <Select options={[{ value: "petrol", label: "Petrol" }, { value: "diesel", label: "Diesel" }, { value: "electric", label: "Electric" }]} placeholder="Select fuel type" />
              </FormField>
              <FormField label="Max Stops" id="max-stops">
                <Input type="number" placeholder="10" />
              </FormField>
              <FormField label="Speed Limit (km/h)" id="speed-limit">
                <Input type="number" placeholder="80" />
              </FormField>
              <FormField label="Cost Per Km ($)" id="cost-per-km">
                <Input type="number" step="0.01" placeholder="0.50" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormField label="Avoid Toll Roads" id="avoid-tolls">
                <Select options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} placeholder="Choose" />
              </FormField>
              <FormField label="Use Traffic Data" id="traffic">
                <Select options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} placeholder="Choose" />
              </FormField>
            </div>
          </FormSection>
        </Card>
      </section>

      <section aria-label="Advanced settings" className="mt-6">
        <Card>
          <FormSection title="Advanced Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Optimization Level" id="optimization">
                <Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} placeholder="Select level" />
              </FormField>
              <FormField label="Cache Duration (hours)" id="cache">
                <Input type="number" placeholder="24" />
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
            Save Settings
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}