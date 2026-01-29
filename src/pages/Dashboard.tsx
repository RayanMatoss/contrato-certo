"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { TopClients } from "@/components/dashboard/TopClients";
import { ExpiringDocuments } from "@/components/dashboard/ExpiringDocuments";

// Dynamic import para Recharts - só carrega quando necessário (client-only)
// Isso remove ~370KB do bundle inicial
const ChartsClient = dynamic(
  () => import("@/components/charts/ChartsClient").then((mod) => ({ default: mod.ContractsChartClient })),
  {
    ssr: false,
    loading: () => (
      <div className="col-span-full lg:col-span-2 border rounded-lg p-6" style={{ minHeight: 280 }}>
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          Carregando gráfico...
        </div>
      </div>
    ),
  }
);

export default function Dashboard() {
  // Defer: só renderizar chart após mount (evita carregar no SSR)
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    setShowChart(true);
  }, []);
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos seus contratos e notas fiscais
        </p>
      </div>

      {/* Metrics Cards */}
      <DashboardCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart + Top Clients */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart só renderiza após mount - remove recharts do bundle inicial */}
          {showChart ? <ChartsClient /> : (
            <div className="border rounded-lg p-6" style={{ minHeight: 280 }}>
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Carregando gráfico...
              </div>
            </div>
          )}
          <TopClients />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <UpcomingTasks />
          <ExpiringDocuments />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivity />
    </div>
  );
}
