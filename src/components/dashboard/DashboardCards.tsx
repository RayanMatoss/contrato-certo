"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, AlertTriangle, Wallet, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";

interface DashboardMetrics {
  contracts_expiring_soon: number;
  invoices_to_issue: number;
  overdue_invoices: number;
  receivables_this_month: number;
  forecast_30_days: number;
  forecast_60_days: number;
}

export function DashboardCards() {
  const { tenantId, isLoading: loadingTenant } = useTenant();

  // Buscar métricas do dashboard
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["dashboard-metrics", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const functionName = "get_dashboard_metrics" as never;
      const { data, error } = await supabase.rpc(functionName, {
        p_tenant_id: tenantId,
      } as never);

      if (error) throw error;
      return (data && data[0]) as DashboardMetrics | undefined;
    },
    enabled: !!tenantId,
  });

  // Buscar contagem de tarefas pendentes
  const { data: tasksCount = 0 } = useQuery({
    queryKey: ["tasks-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;

      const { count, error } = await supabase
        .from("tasks" as never)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pendente", "em_andamento"]);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Buscar contagem de recebíveis do mês
  const { data: receivablesCount = 0 } = useQuery({
    queryKey: ["receivables-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { count, error } = await supabase
        .from("invoices" as never)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("competencia", `${currentYear}-${String(currentMonth).padStart(2, "0")}`)
        .in("status", ["emitida", "enviada", "paga", "parcial"]);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
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
        {[...Array(6)].map((_, i) => (
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
        title="Notas a Emitir"
        value={metrics?.invoices_to_issue ?? 0}
        subtitle="Este mês"
        icon={Receipt}
        variant="primary"
      />
      <StatCard
        title="Notas Vencidas"
        value={metrics?.overdue_invoices ?? 0}
        subtitle="Aguardando pagamento"
        icon={AlertTriangle}
        variant="danger"
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
