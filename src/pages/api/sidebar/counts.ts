import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Server-side Supabase client (não vai para o bundle do client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tenantId, type } = req.query;

  if (!tenantId || typeof tenantId !== "string") {
    return res.status(400).json({ error: "tenantId is required" });
  }

  if (!type || typeof type !== "string") {
    return res.status(400).json({ error: "type is required" });
  }

  try {
    let count = 0;

    if (type === "contracts") {
      const tableName = "contracts" as never;
      const { count: contractsCount } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "ativo")
        .gte("data_fim", new Date().toISOString().split("T")[0])
        .lte("data_fim", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      count = contractsCount || 0;
    } else if (type === "invoices") {
      const tableName = "invoices" as never;
      const { count: invoicesCount } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "a_emitir");
      count = invoicesCount || 0;
    } else if (type === "tasks") {
      const tableName = "tasks" as never;
      const { count: tasksCount } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pendente", "em_andamento"]);
      count = tasksCount || 0;
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
