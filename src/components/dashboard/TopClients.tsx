import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Client {
  id: string;
  name: string;
  initials: string;
  revenue: number;
  contracts: number;
  percentage: number;
}

// Dados mockados removidos - agora buscamos do Supabase
const clients: Client[] = [];

const avatarColors = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
  "bg-info/10 text-info",
  "bg-muted text-muted-foreground",
];

export function TopClients() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Top Contratantes (Receita)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {clients.map((client, index) => (
            <div key={client.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                    {client.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.contracts} contrato{client.contracts > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    R$ {client.revenue.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground">{client.percentage}%</p>
                </div>
              </div>
              <Progress value={client.percentage} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
