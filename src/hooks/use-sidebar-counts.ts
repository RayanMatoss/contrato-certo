"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "./use-tenant";

/**
 * Hook para buscar contadores do sidebar via API routes
 * Isso evita importar supabase SDK no bundle inicial
 */
export function useSidebarCounts() {
  const { tenantId } = useTenant();

  const { data: contractsCount = 0 } = useQuery({
    queryKey: ["sidebar-contracts-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const res = await fetch(`/api/sidebar/counts?tenantId=${tenantId}&type=contracts`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 segundos
  });

  const { data: invoicesCount = 0 } = useQuery({
    queryKey: ["sidebar-invoices-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const res = await fetch(`/api/sidebar/counts?tenantId=${tenantId}&type=invoices`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
  });

  const { data: tasksCount = 0 } = useQuery({
    queryKey: ["sidebar-tasks-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const res = await fetch(`/api/sidebar/counts?tenantId=${tenantId}&type=tasks`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
  });

  return { contractsCount, invoicesCount, tasksCount };
}
