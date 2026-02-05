"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, Wallet, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

interface DashboardMetrics {
  contracts_expiring_soon: number;
  invoices_to_issue: number;
  overdue_invoices: number;
  receivables_this_month: number;
  forecast_30_days: number;
  forecast_60_days: number;
}

export function DashboardCards() {
  const { tenants, selectedTenantId, isLoading: loadingTenant } = useTenantSelector();
  const tenantIds = selectedTenantId
    ? [selectedTenantId]
    : tenants.map((t) => t.id);

  // Buscar métricas do dashboard (agrega quando "Todas as empresas")
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["dashboard-metrics", tenantIds.join(",")],
    queryFn: async (): Promise<DashboardMetrics | null> => {
      if (tenantIds.length === 0) return null;

      const functionName = "get_dashboard_metrics" as never;
      const allMetrics: DashboardMetrics[] = [];

      for (const tid of tenantIds) {
        const { data, error } = await supabase.rpc(functionName, {
          p_tenant_id: tid,
        } as never);
        if (error) throw error;
        const result = data ?? [];
        if (result[0]) allMetrics.push(result[0] as DashboardMetrics);
      }

      if (allMetrics.length === 0) return null;

      const initial: DashboardMetrics = {
        contracts_expiring_soon: 0,
        receivables_this_month: 0,
        forecast_30_days: 0,
        forecast_60_days: 0,
        invoices_to_issue: 0,
        overdue_invoices: 0,
      };
      return allMetrics.reduce<DashboardMetrics>(
        (acc, m) => ({
          ...acc,
          contracts_expiring_soon: acc.contracts_expiring_soon + (m.contracts_expiring_soon ?? 0),
          receivables_this_month: acc.receivables_this_month + (m.receivables_this_month ?? 0),
          forecast_30_days: acc.forecast_30_days + (m.forecast_30_days ?? 0),
          forecast_60_days: acc.forecast_60_days + (m.forecast_60_days ?? 0),
        }),
        initial
      );
    },
    enabled: tenantIds.length > 0,
  });

  // Buscar contagem de tarefas pendentes
  const { data: tasksCount = 0 } = useQuery({
    queryKey: ["tasks-count", tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return 0;

      const { count, error } = await supabase
        .from("tasks" as never)
        .select("*", { count: "exact", head: true })
        .in("tenant_id", tenantIds)
        .in("status", ["pendente", "em_andamento"]);

      if (error) throw error;
      return count || 0;
    },
    enabled: tenantIds.length > 0,
  });

  // Notas (este mês) - total de notas fiscais do mês atual
  const { data: invoicesThisMonth = 0 } = useQuery({
    queryKey: ["invoices-this-month", tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return 0;
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const competencia = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const { count, error } = await supabase
        .from("invoices" as never)
        .select("*", { count: "exact", head: true })
        .in("tenant_id", tenantIds)
        .eq("competencia", competencia);
      if (error) throw error;
      return count || 0;
    },
    enabled: tenantIds.length > 0,
  });

  // Progressão de contratos - contratos ativos
  const { data: activeContractsCount = 0 } = useQuery({
    queryKey: ["active-contracts-count", tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("contracts" as never)
        .select("*", { count: "exact", head: true })
        .in("tenant_id", tenantIds)
        .eq("status", "ativo");
      if (error) throw error;
      return count || 0;
    },
    enabled: tenantIds.length > 0,
  });

  // Buscar contagem de recebíveis do mês
  const { data: receivablesCount = 0 } = useQuery({
    queryKey: ["receivables-count", tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return 0;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { count, error } = await supabase
        .from("invoices" as never)
        .select("*", { count: "exact", head: true })
        .in("tenant_id", tenantIds)
        .eq("competencia", `${currentYear}-${String(currentMonth).padStart(2, "0")}`)
        .in("status", ["emitida", "enviada", "paga", "parcial"]);

      if (error) throw error;
      return count || 0;
    },
    enabled: tenantIds.length > 0,
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Só mostra loading na primeira carga
  const isInitialLoading = loadingTenant || (isLoadingMetrics && !metrics);

  if (isInitialLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Contratos a Vencer"
        value={metrics?.contracts_expiring_soon ?? 0}
        subtitle="Próximos 60 dias"
        icon={FileText}
        variant="warning"
      />
      <StatCard
        title="Notas"
        value={invoicesThisMonth}
        subtitle="Este mês"
        icon={Receipt}
        variant="primary"
      />
      <StatCard
        title="Progressão de Contratos"
        value={activeContractsCount}
        subtitle="Contratos ativos"
        icon={BarChart3}
        variant="primary"
      />
      <StatCard
        title="Recebíveis do Mês"
        value={formatCurrency(metrics?.receivables_this_month)}
        subtitle={`${receivablesCount} faturas`}
        icon={Wallet}
        variant="success"
      />
      <StatCard
        title="Previsão 30d"
        value={formatCurrency(metrics?.forecast_30_days)}
        subtitle="Baseado em contratos"
        icon={TrendingUp}
        variant="primary"
      />
      <StatCard
        title="Tarefas Pendentes"
        value={tasksCount}
        subtitle="Esta semana"
        icon={Calendar}
        variant="warning"
      />
    </div>
  );
}
