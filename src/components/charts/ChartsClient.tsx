"use client";

// Componente client-only para charts - Recharts só carrega aqui
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ContractsChartClient() {
  const { tenants, selectedTenantId } = useTenantSelector();
  const tenantIds = selectedTenantId ? [selectedTenantId] : tenants.map((t) => t.id);

  const { data: chartData = [] } = useQuery({
    queryKey: ["contracts-progression", tenantIds.join(",")],
    queryFn: async (): Promise<{ month: string; contratos: number; mes: string }[]> => {
      if (tenantIds.length === 0) return [];

      const now = new Date();
      const result: { month: string; contratos: number; mes: string }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = new Date(year, month, 0);
        const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

        const { count, error } = await supabase
          .from("contracts" as never)
          .select("*", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .gte("data_inicio", start)
          .lte("data_inicio", end);

        if (error) throw error;
        result.push({
          month: `${MONTH_NAMES[d.getMonth()]} ${year}`,
          contratos: count || 0,
          mes: `${MONTH_NAMES[d.getMonth()]}`,
        });
      }
      return result;
    },
    enabled: tenantIds.length > 0,
  });

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Progressão de Contratos</CardTitle>
        <p className="text-xs text-muted-foreground">Novos contratos por mês (últimos 6 meses)</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-md)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [value, "Contratos"]}
                labelFormatter={(label, payload) => payload[0]?.payload?.month || label}
              />
              <Bar
                dataKey="contratos"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                name="Contratos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
