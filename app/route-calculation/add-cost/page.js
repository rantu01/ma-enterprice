"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/forms/FormField";
import FormSection from "@/components/forms/FormSection";
import { useToast } from "@/components/contexts/ToastContext";
import { Route, MapPin, Truck, DollarSign, Calendar, FileText } from "lucide-react";

const vehicleTypes = [
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
];

export default function AddRouteCostPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data?collection=routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "New Route",
          distance: 100,
          vehicle: "Truck",
          cost: 500,
          status: "Active",
        }),
      });
      if (res.ok) {
        addToast({ type: "success", title: "Success", message: "Route cost added successfully." });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add route cost." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Add Route Cost" breadcrumb={<nav aria-label="Breadcrumb"><span>Route Calculation</span><span>/</span><span>Add Route Cost</span></nav>}>
      <section aria-label="Add route cost form">
        <Card>
          <FormSection title="Route Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Route Name" id="route-name" required>
                <Input placeholder="e.g., Warehouse A → Store 1" />
              </FormField>
              <FormField label="Vehicle Type" id="vehicle-type" required>
                <Select options={vehicleTypes} placeholder="Select vehicle type" />
              </FormField>
              <FormField label="Distance (km)" id="distance" required>
                <Input type="number" placeholder="Enter distance in km" />
              </FormField>
              <FormField label="Cost ($)" id="cost" required>
                <Input type="number" placeholder="Enter cost amount" />
              </FormField>
              <FormField label="Date" id="date" required>
                <Input type="date" />
              </FormField>
              <FormField label="Notes" id="notes">
                <Textarea placeholder="Add any additional notes..." rows={3} />
              </FormField>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button variant="primary" onClick={handleSubmit} loading={loading} aria-label="Save route cost">
                <DollarSign className="h-4 w-4 mr-2" aria-hidden="true" />
                Save Route Cost
              </Button>
              <Button variant="secondary" onClick={() => addToast({ type: "info", title: "Cancelled", message: "Form data cleared." })} aria-label="Cancel">
                Cancel
              </Button>
            </div>
          </FormSection>
        </Card>
      </section>
    </PageContainer>
  );
}