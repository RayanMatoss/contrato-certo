import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, getInvoiceStatusVariant, getStatusLabel } from "@/components/ui/status-badge";
import { FileText, Receipt, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "contract" | "invoice" | "task" | "document";
  title: string;
  description: string;
  status?: string;
  time: string;
}

// Dados mockados removidos - agora buscamos do Supabase
const activities: Activity[] = [];

const typeIcons = {
  contract: FileText,
  invoice: Receipt,
  task: Clock,
  document: CheckCircle,
};

const typeBgColors = {
  contract: "bg-primary/10 text-primary",
  invoice: "bg-success/10 text-success",
  task: "bg-warning/10 text-warning",
  document: "bg-info/10 text-info",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = typeIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={cn("rounded-lg p-2", typeBgColors[activity.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {activity.status && (
                      <StatusBadge
                        label={getStatusLabel(activity.status)}
                        variant={getInvoiceStatusVariant(activity.status)}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
