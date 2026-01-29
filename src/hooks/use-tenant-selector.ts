"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const SELECTED_TENANT_KEY = "selected_tenant_id";

export interface TenantWithRole {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  logo_url?: string | null;
  role: string;
  created_at?: string | null;
}

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
  const { data: tenants, isLoading: loadingTenants } = useQuery<TenantWithRole[]>({
    queryKey: ["user-tenants", userId],
    queryFn: async (): Promise<TenantWithRole[]> => {
      if (!userId) return [];

      // Primeiro buscar os memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("tenant_memberships" as never)
        .select("tenant_id, role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (membershipsError) {
        if (membershipsError.code === "PGRST116") return [];
        throw membershipsError;
      }

      if (!memberships || memberships.length === 0) return [];

      // Buscar os tenants correspondentes
      const typedMemberships = memberships as Array<{ tenant_id: string; role: string; created_at: string }>;
      const tenantIds = typedMemberships.map((m) => m.tenant_id);
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants" as never)
        .select("id, name, slug, cnpj, logo_url, created_at")
        .in("id", tenantIds);

      if (tenantsError) throw tenantsError;

      // Combinar dados
      const typedTenantsData = tenantsData as Array<{ id: string; name?: string; slug?: string; cnpj?: string; logo_url?: string; created_at?: string }> | null;
      return typedMemberships.map((membership): TenantWithRole => {
        const tenant = typedTenantsData?.find((t) => t.id === membership.tenant_id);
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
    gcTime: 30 * 60 * 1000, // 30 minutos (renamed from cacheTime in v5)
  });

  // Obter tenant selecionado do localStorage ou usar o primeiro
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (tenants && tenants.length > 0) {
      const stored = localStorage.getItem(SELECTED_TENANT_KEY);
      // "all" ou vazio = Todas as empresas (visão unificada)
      if (stored === "all" || stored === "" || stored === null) {
        setSelectedTenantIdState(null);
        localStorage.setItem(SELECTED_TENANT_KEY, "all");
        return;
      }
      const storedTenant = tenants.find((t) => t.id === stored);
      if (storedTenant) {
        setSelectedTenantIdState(storedTenant.id);
      } else {
        setSelectedTenantIdState(null);
        localStorage.setItem(SELECTED_TENANT_KEY, "all");
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
        localStorage.setItem(SELECTED_TENANT_KEY, "all");
      }
    }
  };

  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId) || null;

  return {
    tenants: (tenants || []) as TenantWithRole[],
    selectedTenantId,
    selectedTenant: selectedTenant as TenantWithRole | null,
    setSelectedTenantId,
    isLoading: loadingTenants,
  };
}
