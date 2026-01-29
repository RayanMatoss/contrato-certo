"use client";

import { useRouter } from "next/navigation";

/**
 * Hook para logout - evita importar supabase no componente Layout
 * O logout será feito via API route no server
 */
export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Fallback: redirecionar mesmo se API falhar
      router.push("/login");
      router.refresh();
    }
  };

  return { logout };
}
