"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { ContractsChart } from "@/components/dashboard/ContractsChart";
import { TopClients } from "@/components/dashboard/TopClients";
import { ExpiringDocuments } from "@/components/dashboard/ExpiringDocuments";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
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
          <ContractsChart />
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
