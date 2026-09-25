"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import {
  Route,
  DollarSign,
  Navigation,
  Activity,
  Truck,
  FileText,
} from "lucide-react";

export default function RouteCalculationPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data?collection=routes");
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.data || []);
        }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, []);

  const kpiData = [
    {
      title: "Total Routes",
      value: routes.length.toLocaleString(),
      trend: 8.3,
      trendLabel: "vs last month",
      icon: <Route className="h-5 w-5" aria-hidden="true" />,
      variant: "default",
    },
    {
      title: "Total Cost",
      value: `$${routes.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString()}`,
      trend: 5.1,
      trendLabel: "vs last month",
      icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
      variant: "success",
    },
    {
      title: "Average Cost",
      value: `$${routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + (r.cost || 0), 0) / routes.length) : 0}`,
      trend: -2.4,
      trendLabel: "vs last month",
      icon: <Navigation className="h-5 w-5" aria-hidden="true" />,
      variant: "warning",
    },
    {
      title: "Active Routes",
      value: routes.filter((r) => r.status === "Active").length.toString(),
      trend: undefined,
      icon: <Activity className="h-5 w-5" aria-hidden="true" />,
      variant: "info",
    },
  ];

  const recentRoutes = routes.map((r) => ({
    id: r.id,
    route: r.route,
    distance: `${r.distance} km`,
    vehicle: r.vehicle,
    cost: `$${r.cost}`,
    status: r.status,
  }));

  const totalPages = Math.max(1, Math.ceil(recentRoutes.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRoutes = recentRoutes.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const columns = [
    { key: "route", label: "Route", accessor: "route", sortable: true },
    { key: "distance", label: "Distance", accessor: "distance", sortable: true },
    { key: "vehicle", label: "Vehicle", accessor: "vehicle", sortable: true },
    { key: "cost", label: "Cost", accessor: "cost", sortable: true },
    { key: "status", label: "Status", accessor: "status", render: (val) => <Badge variant={val === "Active" ? "active" : val === "Completed" ? "completed" : "pending"}>{val}</Badge> },
  ];

  const handleExport = () => {
    addToast({ type: "success", title: "Success", message: "Report exported successfully." });
  };

  return (
    <PageContainer title="Route Calculation" breadcrumb={<nav aria-label="Breadcrumb"><span>Route Calculation</span></nav>}>
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><div className="h-[96px] bg-[var(--color-hover)] rounded-lg animate-pulse" /></Card>
            ))
          ) : (
            kpiData.map((kpi) => (
              <StatCard key={kpi.title} {...kpi} />
            ))
          )}
        </div>
      </section>

      <section aria-label="Route analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Cost Trend" actions={<Button variant="ghost" size="sm" onClick={handleExport}>Export</Button>}>
          <div className="w-full h-[300px] flex items-center justify-center bg-[var(--color-base)] rounded-md" role="img" aria-label="Cost trend chart visualization">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-end gap-2">
                {[30, 50, 45, 70, 55, 80, 65, 90, 75, 60, 85, 70].map((h, i) => (
                  <div key={i} className="w-6 bg-[var(--color-primary)] rounded-t transition-all hover:bg-[var(--color-primary-hover)]" style={{ height: `${h}%` }} aria-hidden="true" />
                ))}
              </div>
              <p className="text-[0.75rem] text-[var(--color-ink-3)]">Monthly Route Cost</p>
            </div>
          </div>
        </ChartCard>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">Recent Routes</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <DataTable columns={columns} data={paginatedRoutes} emptyMessage="No routes found." pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: recentRoutes.length, itemsPerPage }} />
        </Card>
      </section>
    </PageContainer>
  );
}