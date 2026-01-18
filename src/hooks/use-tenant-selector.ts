"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const SELECTED_TENANT_KEY = "selected_tenant_id";

export function useTenantSelector() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Obter o usuário autenticado
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Buscar todos os tenants do usuário
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["user-tenants", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Primeiro buscar os memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("tenant_memberships")
        .select("tenant_id, role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (membershipsError) {
        if (membershipsError.code === "PGRST116") return [];
        throw membershipsError;
      }

      if (!memberships || memberships.length === 0) return [];

      // Buscar os tenants correspondentes
      const tenantIds = memberships.map((m) => m.tenant_id);
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, cnpj, logo_url, created_at")
        .in("id", tenantIds);

      if (tenantsError) throw tenantsError;

      // Combinar dados
      return memberships.map((membership) => {
        const tenant = tenantsData?.find((t) => t.id === membership.tenant_id);
        return {
          id: membership.tenant_id,
          name: tenant?.name || "Sem nome",
          slug: tenant?.slug || "",
          cnpj: tenant?.cnpj || null,
          logo_url: tenant?.logo_url || null,
          role: membership.role,
          created_at: tenant?.created_at || null,
        };
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Obter tenant selecionado do localStorage ou usar o primeiro
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return; // Verificar se está no cliente
    
    if (tenants && tenants.length > 0) {
      const stored = localStorage.getItem(SELECTED_TENANT_KEY);
      const storedTenant = tenants.find((t) => t.id === stored);
      
      if (storedTenant) {
        setSelectedTenantIdState(storedTenant.id);
      } else {
        // Usar o primeiro tenant disponível
        setSelectedTenantIdState(tenants[0].id);
        localStorage.setItem(SELECTED_TENANT_KEY, tenants[0].id);
      }
    } else {
      setSelectedTenantIdState(null);
      localStorage.removeItem(SELECTED_TENANT_KEY);
    }
  }, [tenants]);

  const setSelectedTenantId = (tenantId: string | null) => {
    setSelectedTenantIdState(tenantId);
    if (typeof window !== "undefined") {
      if (tenantId) {
        localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
      } else {
        localStorage.removeItem(SELECTED_TENANT_KEY);
      }
    }
  };

  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId) || null;

  return {
    tenants: tenants || [],
    selectedTenantId,
    selectedTenant,
    setSelectedTenantId,
    isLoading: loadingTenants,
  };
}
