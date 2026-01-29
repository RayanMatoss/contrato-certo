import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/tenants/create
 * Cria um novo tenant (empresa) + membership como admin.
 * Usa service_role no servidor para bypassar RLS = solução definitiva.
 * Body: { name: string, slug: string, cnpj?: string }
 * Header: Authorization: Bearer <access_token>
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (!supabaseServiceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY não configurada");
    return res.status(500).json({
      error:
        "Servidor sem chave de serviço. Configure SUPABASE_SERVICE_ROLE_KEY na Vercel.",
    });
  }

  const body = req.body as { name?: string; slug?: string; cnpj?: string };
  const name = body?.name?.trim();
  const slug = body?.slug?.trim();
  const cnpj = body?.cnpj?.trim() || null;
  if (!name || !slug) {
    return res.status(400).json({ error: "name e slug são obrigatórios" });
  }

  try {
    const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    const adminClient = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Database types não incluem tabelas; API usa service_role
    const admin = adminClient as any;
    await admin.from("users").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) ?? "",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name,
        slug,
        cnpj,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Erro ao criar tenant:", tenantError);
      return res.status(400).json({ error: (tenantError as Error).message });
    }

    const tenantId = (tenant as { id: string } | null)?.id;
    if (!tenantId) {
      return res.status(500).json({ error: "Erro ao criar tenant" });
    }

    const { error: membershipError } = await admin.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: user.id,
      role: "admin",
      created_at: new Date().toISOString(),
    });

    if (membershipError) {
      await admin.from("tenants").delete().eq("id", tenantId);
      console.error("Erro ao criar membership:", membershipError);
      return res.status(500).json({ error: "Erro ao vincular empresa ao usuário" });
    }

    return res.status(200).json(tenant);
  } catch (err) {
    console.error("Erro em /api/tenants/create:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
