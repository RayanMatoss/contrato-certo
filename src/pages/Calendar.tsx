"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  FileText,
  ShieldCheck,
  Bell,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";
// Dynamic import para reduzir bundle inicial - dialog só carrega quando necessário
import dynamic from "next/dynamic";
const NewTaskDialog = dynamic(() => import("@/components/tasks/NewTaskDialog").then(mod => ({ default: mod.NewTaskDialog })), { ssr: false });

type UUID = string;

interface TaskRow {
  id: UUID;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  due_date?: string | null;
  contract_id?: string | null;
  client_id?: string | null;
  invoice_id?: string | null;
  assigned_to?: string | null;
  created_by: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  clients?: { razao_social?: string; nome_fantasia?: string | null } | null;
  tenants?: { id: UUID; name: string; slug: string } | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  type: "emissao_nf" | "envio_nf" | "cobranca" | "renovacao_contrato" | "renovacao_certidao" | "outros";
  status: "pendente" | "em_andamento" | "concluida" | "cancelada";
  description?: string | null;
  tenant_id?: string;
  tenantName?: string;
  client?: {
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
}

const typeIcons = {
  emissao_nf: Receipt,
  envio_nf: Receipt,
  cobranca: FileText,
  renovacao_certidao: ShieldCheck,
  renovacao_contrato: FileText,
  outros: Bell,
};

const typeColors = {
  emissao_nf: "bg-primary/10 text-primary border-primary/20",
  envio_nf: "bg-primary/10 text-primary border-primary/20",
  cobranca: "bg-warning/10 text-warning border-warning/20",
  renovacao_certidao: "bg-info/10 text-info border-info/20",
  renovacao_contrato: "bg-success/10 text-success border-success/20",
  outros: "bg-muted text-muted-foreground border-border",
};


const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("week");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);

  const { tenantId, isLoading: loadingTenant } = useTenant();
  const { tenants } = useTenantSelector();
  const tenantIds = useMemo(
    () => (tenantFilter ? [tenantFilter] : tenants.map((t) => t.id)),
    [tenantFilter, tenants]
  );

  // Buscar tarefas do Supabase - de todas as empresas ou filtrado
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", tenantFilter],
    queryFn: async () => {
      
      if (tenantIds.length === 0) return [];

      const { data, error } = await supabase
        .from("tasks" as never)
        .select(`
          id,
          title,
          description,
          type,
          status,
          due_date,
          tenant_id,
          clients:client_id (
            razao_social,
            nome_fantasia
          ),
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .in("tenant_id", tenantIds as string[])
        .not("status", "eq", "cancelada")
        .order("due_date", { ascending: true });

      if (error) throw error;
      
      const typedData = (data || []) as TaskRow[];
      return typedData
        .filter((task): task is TaskRow & { due_date: string } => !!task.due_date)
        .map((task: TaskRow & { due_date: string }) => ({
          id: task.id,
          title: task.title,
          due_date: task.due_date,
          type: task.type as Task["type"],
          status: task.status as Task["status"],
          description: task.description ?? null,
          tenant_id: task.tenant_id,
          tenantName: task.tenants?.name || "Empresa não encontrada",
          client: task.clients ? {
            razao_social: task.clients.razao_social || "",
            nome_fantasia: task.clients.nome_fantasia ?? null,
          } : null,
        })) as Task[];
    },
    enabled: !loadingTenant && tenants.length > 0,
  });

  const tasks: Task[] = useMemo(() => tasksData || [], [tasksData]);

  // Contratos: vigências (data_fim) para marcar no calendário
  const { data: contractsData } = useQuery({
    queryKey: ["contracts-calendar", tenantFilter, tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("contracts" as never)
        .select("id, numero, data_inicio, data_fim, status, clients:client_id(razao_social, nome_fantasia)")
        .in("tenant_id", tenantIds)
        .not("data_fim", "is", null);
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        numero: string;
        data_inicio: string;
        data_fim: string;
        status: string;
        clients?: { razao_social?: string; nome_fantasia?: string | null } | null;
      }>;
    },
    enabled: !loadingTenant && tenants.length > 0,
  });

  const contracts = useMemo(() => contractsData || [], [contractsData]);
  // Conjunto de datas de fim de vigência (YYYY-MM-DD) para o modificador do calendário
  const contractEndDateStrings = useMemo(
    () => new Set(
      contracts
        .map((c) => (c.data_fim && typeof c.data_fim === "string" ? c.data_fim.slice(0, 10) : ""))
        .filter(Boolean)
    ),
    [contracts]
  );
  const hasContractEndModifier = useCallback(
    (day: Date) => {
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, "0");
      const d = String(day.getDate()).padStart(2, "0");
      return contractEndDateStrings.has(`${y}-${m}-${d}`);
    },
    [contractEndDateStrings]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Função para obter tarefas de uma data específica
  const getTasksForDate = useCallback((targetDate: Date) => {
    const dateStr = targetDate.toISOString().split("T")[0];
    return tasks.filter((task) => task.due_date === dateStr);
  }, [tasks]);

  // Filtrar tarefas por período
  const filteredTasks = useMemo(() => {
    if (!date) return tasks;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (activeTab === "day") {
      return getTasksForDate(selectedDate);
    }

    if (activeTab === "week") {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sábado
      
      return tasks.filter((task) => {
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
    }

    if (activeTab === "month") {
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      return tasks.filter((task) => {
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
    }

    return tasks;
  }, [tasks, date, activeTab, getTasksForDate]);

  // Contratos com vigência (data_fim) no período selecionado
  const filteredContractVigencias = useMemo(() => {
    if (!date || contracts.length === 0) return [];
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (activeTab === "day") {
      const dateStr = selectedDate.toISOString().split("T")[0];
      return contracts.filter((c) => c.data_fim && c.data_fim.slice(0, 10) === dateStr);
    }
    if (activeTab === "week") {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return contracts.filter((c) => {
        const d = new Date(c.data_fim);
        d.setHours(0, 0, 0, 0);
        return d >= weekStart && d <= weekEnd;
      });
    }
    if (activeTab === "month") {
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      return contracts.filter((c) => {
        const d = new Date(c.data_fim);
        d.setHours(0, 0, 0, 0);
        return d >= monthStart && d <= monthEnd;
      });
    }
    return [];
  }, [contracts, date, activeTab]);

  const formatDateFull = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                Tarefas, eventos e lembretes vinculados a contratos
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
          <TenantFilter
            value={tenantFilter}
            onValueChange={setTenantFilter}
            className="w-full sm:w-auto"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setCurrentMonth(newMonth);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setCurrentMonth(newMonth);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md"
                modifiers={{
                  hasTask: tasks.map((t) => new Date(t.due_date)),
                  hasContractEnd: hasContractEndModifier,
                }}
                modifiersStyles={{
                  hasTask: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  },
                  hasContractEnd: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--success) / 0.2)",
                    color: "hsl(var(--success))",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Tarefas</CardTitle>
                  <TabsList className="h-8">
                    <TabsTrigger value="day" className="text-xs px-3">Dia</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3">Mês</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="week" className="mt-4 space-y-3">
                  {loadingTasks || loadingTenant ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : filteredTasks.length === 0 && filteredContractVigencias.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-base font-medium">Nenhuma tarefa nem vigência nesta semana</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em &quot;Nova Tarefa&quot; ou cadastre contratos com vigência
                      </p>
                    </div>
                  ) : (
                    <>
                    {filteredTasks.map((task) => {
                      const Icon = typeIcons[task.type];
                      const clientName = task.client?.nome_fantasia || task.client?.razao_social;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
                            typeColors[task.type]
                          )}
                        >
                          <div className="rounded-lg p-2 bg-background">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            {clientName && (
                              <p className="text-xs text-muted-foreground">{clientName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn("text-xs", 
                                task.status === "concluida" ? "bg-success text-success-foreground" :
                                task.status === "em_andamento" ? "bg-warning text-warning-foreground" :
                                "bg-muted text-muted-foreground"
                              )}
                            >
                              {task.status === "concluida" ? "Concluída" :
                               task.status === "em_andamento" ? "Em Andamento" :
                               "Pendente"}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredContractVigencias.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Vigências de contratos</p>
                        <div className="space-y-2">
                          {filteredContractVigencias.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-success/5 border-success/20"
                            >
                              <div className="rounded-lg p-2 bg-success/10">
                                <FileText className="h-4 w-4 text-success" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">Contrato {c.numero}</p>
                                <p className="text-xs text-muted-foreground">
                                  Fim da vigência em {formatDateFull(c.data_fim)}
                                </p>
                                {(c.clients?.nome_fantasia || c.clients?.razao_social) && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {c.clients.nome_fantasia || c.clients.razao_social}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="day" className="mt-4">
                  {loadingTasks || loadingTenant ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : filteredTasks.length === 0 && filteredContractVigencias.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-base font-medium">
                        {date ? `Nenhuma tarefa nem vigência para ${formatDate(date.toISOString())}` : "Nenhuma tarefa para hoje"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Selecione uma data no calendário ou clique em &quot;Nova Tarefa&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => {
                        const Icon = typeIcons[task.type];
                        const clientName = task.client?.nome_fantasia || task.client?.razao_social;
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-sm",
                              typeColors[task.type]
                            )}
                          >
                            <div className="rounded-lg p-2 bg-background">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              {clientName && (
                                <p className="text-xs text-muted-foreground">{clientName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", 
                                  task.status === "concluida" ? "bg-success text-success-foreground" :
                                  task.status === "em_andamento" ? "bg-warning text-warning-foreground" :
                                  "bg-muted text-muted-foreground"
                                )}
                              >
                                {task.status === "concluida" ? "Concluída" :
                                 task.status === "em_andamento" ? "Em Andamento" :
                                 "Pendente"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {filteredContractVigencias.length > 0 && (
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Vigências</p>
                          {filteredContractVigencias.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-success/5 border-success/20"
                            >
                              <FileText className="h-4 w-4 text-success shrink-0" />
                              <span className="flex-1 text-sm truncate">Contrato {c.numero} – fim em {formatDateFull(c.data_fim)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="month" className="mt-4">
                  {loadingTasks || loadingTenant ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : filteredTasks.length === 0 && filteredContractVigencias.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-base font-medium">Nenhuma tarefa nem vigência neste mês</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em &quot;Nova Tarefa&quot; ou cadastre contratos com vigência
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => {
                        const Icon = typeIcons[task.type];
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm truncate">{task.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(task.due_date)}
                            </span>
                          </div>
                        );
                      })}
                      {filteredContractVigencias.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-success/5 border-success/20"
                        >
                          <FileText className="h-4 w-4 text-success shrink-0" />
                          <span className="flex-1 text-sm truncate">Contrato {c.numero} – fim em {formatDateFull(c.data_fim)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Emissão NF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">Cobrança</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-info" />
                <span className="text-xs text-muted-foreground">Certidão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">Contrato / Vigência (fim)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Task Dialog - Defer: só renderiza quando aberto */}
      {tenantId && isNewTaskOpen && (
        <NewTaskDialog
          open={isNewTaskOpen}
          onOpenChange={setIsNewTaskOpen}
          tenantId={tenantId}
          selectedDate={date}
        />
      )}
    </AppLayout>
  );
}
