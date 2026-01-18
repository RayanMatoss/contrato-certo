"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Loader2, Building2 } from "lucide-react";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

// Funções auxiliares para formatação de moeda
const formatCurrency = (value: string | number | null | undefined): string => {
  if (!value && value !== 0) return "";
  const numValue = typeof value === "string" 
    ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) 
    : value;
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
};

const parseCurrency = (value: string): number => {
  if (!value || value.trim() === "") return 0;
  // Remover R$, espaços e outros caracteres, manter apenas números, vírgula e ponto
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const invoiceSchema = z.object({
  tenant_id: z.string().min(1, "Empresa é obrigatória"),
  contract_id: z.string().min(1, "Contrato é obrigatório"),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, "Competência deve estar no formato YYYY-MM"),
  numero_nf: z.string().optional(),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  valor_bruto: z.string().min(1, "Valor bruto é obrigatório").refine((val) => {
    if (!val || val.trim() === "") return false;
    const parsed = parseCurrency(val);
    return !isNaN(parsed) && parsed > 0;
  }, { message: "Valor bruto deve ser maior que zero" }),
  valor_impostos: z.string().optional(),
  valor_liquido: z.string().optional(), // Calculado automaticamente, não obrigatório
  status: z.enum(["em_cobranca", "paga"]),
  observacoes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string; // Opcional agora, pois pode vir do formulário
  invoiceId?: string; // Para edição
}

export function NewInvoiceDialog({ open, onOpenChange, tenantId, invoiceId }: NewInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const isEditing = !!invoiceId;
  const { tenants, selectedTenantId: currentTenantId } = useTenantSelector();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: "em_cobranca",
      competencia: new Date().toISOString().slice(0, 7), // YYYY-MM do mês atual
      tenant_id: currentTenantId || "",
    },
  });

  // Buscar dados da nota fiscal para edição
  const { data: invoiceData, isLoading: loadingInvoice } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId && open,
  });

  // Preencher formulário quando os dados da nota fiscal forem carregados
  useEffect(() => {
    if (invoiceData && isEditing) {
      form.reset({
        tenant_id: invoiceData.tenant_id,
        contract_id: invoiceData.contract_id,
        competencia: invoiceData.competencia,
        numero_nf: invoiceData.numero_nf || "",
        data_vencimento: invoiceData.data_vencimento,
        valor_bruto: formatCurrency(invoiceData.valor_bruto),
        valor_impostos: formatCurrency(invoiceData.valor_impostos || 0),
        valor_liquido: formatCurrency(invoiceData.valor_liquido),
        status: invoiceData.status as "em_cobranca" | "paga",
        observacoes: invoiceData.observacoes || "",
      });
      setSelectedContractId(invoiceData.contract_id);
    }
  }, [invoiceData, isEditing, form]);

  // Observar tenant_id selecionado no formulário para buscar contratos
  const selectedTenantId = form.watch("tenant_id");

  // Buscar contratos ativos baseado no tenant_id selecionado
  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      
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
        .eq("tenant_id", selectedTenantId)
        .eq("status", "ativo")
        .order("numero");

      if (error) throw error;
      return data;
    },
    enabled: open && !!selectedTenantId,
  });

  // Buscar cliente do contrato selecionado
  const { data: contractData } = useQuery({
    queryKey: ["contract", selectedContractId],
    queryFn: async () => {
      if (!selectedContractId) return null;
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          client_id,
          clients:client_id (
            id,
            razao_social,
            nome_fantasia
          )
        `)
        .eq("id", selectedContractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedContractId && open,
  });

  // Mutation para criar/atualizar nota fiscal
  const saveInvoice = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const clientId = contractData?.client_id || invoiceData?.client_id;
      if (!clientId) {
        throw new Error("Contratante não encontrado para o contrato selecionado");
      }

      // Calcular valor líquido automaticamente
      const valorBruto = parseCurrency(values.valor_bruto);
      const valorImpostos = parseCurrency(values.valor_impostos || "0");
      const valorLiquido = valorBruto - valorImpostos;

      const invoiceData = {
        contract_id: values.contract_id,
        client_id: clientId,
        competencia: values.competencia,
        numero_nf: values.numero_nf || null,
        data_vencimento: values.data_vencimento,
        valor_bruto: valorBruto,
        valor_impostos: valorImpostos,
        valor_liquido: valorLiquido,
        retencoes: 0, // Sempre 0, campo removido do formulário
        status: values.status,
        observacoes: values.observacoes || null,
      };

      if (isEditing && invoiceId) {
        // Atualizar nota fiscal existente
        const { data, error } = await supabase
          .from("invoices")
          .update({
            ...invoiceData,
            tenant_id: values.tenant_id,
          })
          .eq("id", invoiceId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova nota fiscal
        const { data, error } = await supabase
          .from("invoices")
          .insert({
            ...invoiceData,
            tenant_id: values.tenant_id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Nota fiscal atualizada com sucesso!" : "Nota fiscal criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      form.reset({
        status: "em_cobranca",
        competencia: new Date().toISOString().slice(0, 7),
        tenant_id: currentTenantId || "",
      });
      setSelectedContractId("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ${isEditing ? "atualizar" : "criar"} nota fiscal: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    saveInvoice.mutate(values);
  };

  // Resetar formulário quando o dialog fechar (apenas se não estiver editando)
  useEffect(() => {
    if (!open && !isEditing) {
      form.reset({
        status: "em_cobranca",
        competencia: new Date().toISOString().slice(0, 7),
        tenant_id: currentTenantId || "",
      });
      setSelectedContractId("");
    }
  }, [open, form, isEditing, currentTenantId]);

  // Atualizar tenant_id quando currentTenantId mudar (se não estiver editando)
  useEffect(() => {
    if (!isEditing && currentTenantId && !form.getValues("tenant_id")) {
      form.setValue("tenant_id", currentTenantId);
    }
  }, [currentTenantId, isEditing, form]);

  // Observar valores dos campos para cálculo automático
  const valorBruto = useWatch({ control: form.control, name: "valor_bruto" });
  const valorImpostos = useWatch({ control: form.control, name: "valor_impostos" });
  const contractId = useWatch({ control: form.control, name: "contract_id" });

  // Atualizar client_id quando o contrato mudar
  useEffect(() => {
    if (contractId) {
      setSelectedContractId(contractId);
    }
  }, [contractId]);

  // Calcular valor líquido automaticamente quando os valores mudarem
  useEffect(() => {
    const brutoStr = String(valorBruto || "");
    if (brutoStr.trim() !== "") {
      const bruto = parseCurrency(brutoStr);
      const impostos = parseCurrency(String(valorImpostos || "0"));
      const liquido = bruto - impostos;

      // Sempre calcular, mesmo que seja negativo (para mostrar ao usuário)
      const formatted = formatCurrency(liquido);
      form.setValue("valor_liquido", formatted, { shouldValidate: false, shouldDirty: false, shouldTouch: false });
    } else {
      // Limpar campo se não houver valor bruto
      form.setValue("valor_liquido", "", { shouldValidate: false, shouldDirty: false, shouldTouch: false });
    }
  }, [valorBruto, valorImpostos, form]);

  // Se não houver empresas disponíveis, mostrar mensagem
  if (tenants.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nenhuma Empresa Disponível</DialogTitle>
            <DialogDescription>
              Você precisa ter pelo menos uma empresa cadastrada para criar notas fiscais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Acesse a página "Empresas" para criar uma nova empresa.
            </p>
          </div>
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
          <DialogTitle>{isEditing ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite os dados da nota fiscal. Campos obrigatórios estão marcados com *."
              : "Preencha os dados da nova nota fiscal. Campos obrigatórios estão marcados com *."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar contrato quando mudar de empresa
                        form.setValue("contract_id", "");
                        setSelectedContractId("");
                      }} 
                      value={field.value}
                      disabled={tenants.length === 0 || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa">
                            {field.value && tenants.find((t) => t.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{tenant.name}</p>
                                {tenant.cnpj && (
                                  <p className="text-xs text-muted-foreground">{tenant.cnpj}</p>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingContracts || loadingInvoice || isEditing || !selectedTenantId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedTenantId 
                              ? "Selecione uma empresa primeiro" 
                              : "Selecione um contrato"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contracts && contracts.length > 0 ? (
                          contracts.map((contract: any) => {
                            const cliente = contract.clients?.nome_fantasia || contract.clients?.razao_social || "Contratante não encontrado";
                            return (
                              <SelectItem key={contract.id} value={contract.id}>
                                {contract.numero} - {cliente}
                              </SelectItem>
                            );
                          })
                        ) : selectedTenantId ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Nenhum contrato ativo encontrado para esta empresa
                          </div>
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência *</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_nf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da NF</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_bruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Bruto *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="R$ 0,00" 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remover tudo exceto números
                          const numbers = value.replace(/\D/g, "");
                          
                          if (numbers === "") {
                            field.onChange("");
                            return;
                          }
                          
                          // Converter para número (sempre tratar como centavos)
                          const numValue = parseFloat(numbers) / 100;
                          const formatted = formatCurrency(numValue);
                          field.onChange(formatted);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_impostos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Impostos</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="R$ 0,00" 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numbers = value.replace(/\D/g, "");
                          if (numbers === "") {
                            field.onChange("");
                            return;
                          }
                          const numValue = parseFloat(numbers) / 100;
                          const formatted = formatCurrency(numValue);
                          field.onChange(formatted);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_liquido"
                render={({ field }) => {
                  // Calcular valor líquido em tempo real: bruto - impostos
                  const brutoStr = String(valorBruto || "");
                  let calculatedValue = "";
                  if (brutoStr.trim() !== "") {
                    const bruto = parseCurrency(brutoStr);
                    const impostos = parseCurrency(String(valorImpostos || "0"));
                    const liquido = bruto - impostos;
                    calculatedValue = formatCurrency(liquido);
                  }
                  
                  return (
                    <FormItem>
                      <FormLabel>Valor Líquido</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="R$ 0,00" 
                          value={calculatedValue || field.value || ""}
                          readOnly 
                          className="bg-muted cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="em_cobranca">Em Aberto</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a nota fiscal"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingInvoice}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Nota Fiscal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
