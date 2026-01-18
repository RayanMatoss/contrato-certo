import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Receipt, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  type: "emissao_nf" | "cobranca" | "renovacao_certidao" | "renovacao_contrato";
  priority: "alta" | "media" | "baixa";
  completed: boolean;
}

// Dados mockados removidos - agora buscamos do Supabase
const tasks: Task[] = [];

const typeIcons = {
  emissao_nf: Receipt,
  cobranca: FileText,
  renovacao_certidao: ShieldCheck,
  renovacao_contrato: Calendar,
};

const priorityColors = {
  alta: "bg-destructive/10 text-destructive border-destructive/20",
  media: "bg-warning/10 text-warning border-warning/20",
  baixa: "bg-muted text-muted-foreground border-border",
};

export function UpcomingTasks() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Tarefas Pendentes</CardTitle>
          <Badge variant="secondary" className="font-normal">
            {tasks.filter((t) => !t.completed).length} pendentes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {tasks.map((task) => {
            const Icon = typeIcons[task.type];
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  "hover:bg-muted/50 cursor-pointer",
                  task.completed && "opacity-50"
                )}
              >
                <Checkbox
                  checked={task.completed}
                  className="h-4 w-4"
                />
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    task.completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-normal", priorityColors[task.priority])}
                >
                  {task.dueDate}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
