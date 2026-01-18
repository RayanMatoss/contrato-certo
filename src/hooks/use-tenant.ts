"use client";

import { useTenantSelector } from "./use-tenant-selector";

// Hook mantido para compatibilidade, mas agora usa o tenant selecionado
export function useTenant() {
  const { selectedTenantId, isLoading } = useTenantSelector();
  return { tenantId: selectedTenantId, isLoading };
}
