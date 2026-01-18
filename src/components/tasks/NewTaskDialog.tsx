"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const taskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["emissao_nf", "envio_nf", "cobranca", "renovacao_contrato", "renovacao_certidao", "outros"]),
  status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  contract_id: z.string().optional(),
  client_id: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  selectedDate?: Date;
}

export function NewTaskDialog({ open, onOpenChange, tenantId, selectedDate }: NewTaskDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: "pendente",
      type: "outros",
      due_date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    },
  });

  // Buscar contratos ativos
  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          numero,
          clients:client_id (
            id,
            razao_social,
            nome_fantasia
          )
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "ativo")
        .order("numero");

      if (error) throw error;
      return data;
    },
    enabled: open && !!tenantId,
  });

  // Buscar contratantes
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("clients")
        .select("id, razao_social, nome_fantasia")
        .eq("tenant_id", tenantId)
        .eq("status", "ativo")
        .order("razao_social");

      if (error) throw error;
      return data;
    },
    enabled: open && !!tenantId,
  });

  // Mutation para criar tarefa
  const createTask = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          tenant_id: tenantId,
          title: values.title,
          description: values.description || null,
          type: values.type,
          status: values.status,
          due_date: values.due_date,
          contract_id: values.contract_id || null,
          client_id: values.client_id || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tasks", tenantId] });
      form.reset({
        status: "pendente",
        type: "outros",
        due_date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    createTask.mutate(values);
  };

  // Resetar formulário quando o dialog fechar ou data selecionada mudar
  useEffect(() => {
    if (open) {
      form.reset({
        status: "pendente",
        type: "outros",
        due_date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      });
    }
  }, [open, selectedDate, form]);

  if (!tenantId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erro de Configuração</DialogTitle>
            <DialogDescription>
              Não foi possível identificar o tenant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova tarefa. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Emitir nota fiscal de janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada da tarefa"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emissao_nf">Emissão NF</SelectItem>
                        <SelectItem value="envio_nf">Envio NF</SelectItem>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                        <SelectItem value="renovacao_contrato">Renovação Contrato</SelectItem>
                        <SelectItem value="renovacao_certidao">Renovação Certidão</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || undefined)}
                      value={field.value || undefined}
                      disabled={loadingContracts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contrato (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contracts?.map((contract: any) => {
                          const cliente = contract.clients?.nome_fantasia || contract.clients?.razao_social || "Contratante não encontrado";
                          return (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.numero} - {cliente}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contratante</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || undefined)}
                      value={field.value || undefined}
                      disabled={loadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contratante (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nome_fantasia || client.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
