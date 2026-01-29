"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { Loader2, Building2, Upload, X, File } from "lucide-react";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

const contractSchema = z.object({
  tenant_id: z.string().min(1, "Empresa é obrigatória"),
  client_id: z.string().min(1, "Contratante é obrigatório"),
  numero: z.string().min(1, "Número do contrato é obrigatório"),
  objeto: z.string().min(1, "Objeto é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  valor_mensal: z.string().optional(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  status: z.enum(["rascunho", "ativo", "suspenso", "encerrado", "cancelado"]),
  periodicidade_reajuste: z.string().optional(),
  responsavel_interno: z.string().optional(),
}).refine((data) => {
  const inicio = new Date(data.data_inicio);
  const fim = new Date(data.data_fim);
  return fim >= inicio;
}, {
  message: "Data de fim deve ser maior ou igual à data de início",
  path: ["data_fim"],
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface NewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string; // Opcional agora, pois pode vir do formulário
  contractId?: string;
}

export function NewContractDialog({ open, onOpenChange, contractId }: NewContractDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!contractId;
  const { tenants, selectedTenantId: currentTenantId } = useTenantSelector();
  const tenantsArray = useMemo(() => (Array.isArray(tenants) ? tenants : []), [tenants]);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      status: "rascunho",
      tenant_id: currentTenantId || tenantsArray[0]?.id || "",
    },
  });

  // Buscar dados do contrato quando for edição
  const { data: contractData, isLoading: loadingContract } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      if (!contractId) return null;
      
      const tableName = "contracts" as never;
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", contractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing && open && !!contractId,
  });

  // Preencher formulário quando os dados do contrato forem carregados
  useEffect(() => {
    if (contractData && isEditing) {
      const formatCurrency = (value: number | null) => {
        if (!value) return "";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
      };

      const typedContractData = contractData as {
        tenant_id: string;
        client_id: string;
        numero: string;
        objeto: string;
        valor_total: number;
        valor_mensal?: number;
        data_inicio: string;
        data_fim: string;
        status: string;
        periodicidade_reajuste?: number;
        responsavel_interno?: string;
        file_path?: string;
        file_size?: number;
        file_mime_type?: string;
      };

      form.reset({
        tenant_id: typedContractData.tenant_id,
        client_id: typedContractData.client_id,
        numero: typedContractData.numero,
        objeto: typedContractData.objeto,
        valor_total: formatCurrency(typedContractData.valor_total),
        valor_mensal: formatCurrency(typedContractData.valor_mensal),
        data_inicio: typedContractData.data_inicio?.split("T")[0] || "",
        data_fim: typedContractData.data_fim?.split("T")[0] || "",
        status: typedContractData.status as "rascunho" | "ativo" | "suspenso" | "encerrado" | "cancelado",
        periodicidade_reajuste: typedContractData.periodicidade_reajuste?.toString() || undefined,
        responsavel_interno: typedContractData.responsavel_interno || undefined,
      });
    }
  }, [contractData, isEditing, form]);

  const selectedTenantId = form.watch("tenant_id");
  const tenantIds = tenantsArray.map((t) => t.id);

  // Buscar contratantes de TODAS as empresas do usuário (disponíveis para qualquer contrato)
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients", "all-tenants", tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("clients" as never)
        .select("id, razao_social, nome_fantasia, tenant_id")
        .in("tenant_id", tenantIds)
        .eq("status", "ativo")
        .order("razao_social");
      if (error) {
        console.error("❌ Erro ao buscar contratantes:", error);
        throw error;
      }
      return data || [];
    },
    enabled: open && tenantIds.length > 0,
  });

  // Mutation para criar ou atualizar contrato
  const saveContract = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      let filePath: string | null = null;
      let fileSize: number | null = null;
      let fileMimeType: string | null = null;

      // Upload do arquivo se houver
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `contract_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        filePath = `${values.tenant_id}/contracts/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents" as never)
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
        }

        fileSize = selectedFile.size;
        fileMimeType = selectedFile.type;
      }

      const contractData = {
        tenant_id: values.tenant_id,
        client_id: values.client_id,
        numero: values.numero,
        objeto: values.objeto,
        valor_total: parseFloat(values.valor_total.replace(/[^\d,.-]/g, "").replace(",", ".")),
        valor_mensal: values.valor_mensal
          ? parseFloat(values.valor_mensal.replace(/[^\d,.-]/g, "").replace(",", "."))
          : null,
        data_inicio: values.data_inicio,
        data_fim: values.data_fim,
        status: values.status,
        periodicidade_reajuste: values.periodicidade_reajuste
          ? parseInt(values.periodicidade_reajuste)
          : null,
        responsavel_interno: values.responsavel_interno || null,
        file_path: filePath,
        file_size: fileSize,
        file_mime_type: fileMimeType,
      };

      if (isEditing && contractId) {
        // Buscar contrato existente para verificar se há arquivo antigo
        const { data: existingContract, error: fetchError } = await supabase
          .from("contracts" as never)
          .select("file_path")
          .eq("id", contractId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Guardar o caminho do arquivo antigo antes de atualizar
        const oldFilePath = existingContract ? (existingContract as { file_path?: string | null }).file_path || null : null;

        // Atualizar contrato existente
        const tableName = "contracts" as never;
        const { data, error } = await supabase
          .from(tableName)
          .update(contractData as never)
          .eq("id", contractId)
          .select()
          .single();

        if (error) {
          // Se der erro e tiver feito upload, tentar deletar o arquivo
          if (filePath) {
            await supabase.storage.from("documents").remove([filePath]);
          }
          throw error;
        }

        // Se foi feito upload de novo arquivo, deletar o arquivo antigo
        if (filePath && oldFilePath && oldFilePath !== filePath) {
          await supabase.storage.from("documents").remove([oldFilePath]);
        }

        return data;
      } else {
        // Criar novo contrato
        const tableName = "contracts" as never;
        const { data, error } = await supabase
          .from(tableName)
          .insert(contractData as never)
          .select()
          .single();

        if (error) {
          // Se der erro e tiver feito upload, tentar deletar o arquivo
          if (filePath) {
            await supabase.storage.from("documents").remove([filePath]);
          }
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Contrato atualizado com sucesso!" : "Contrato criado com sucesso!");
      // Invalidar todas as queries de contratos (independente do filtro)
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      }
      form.reset({
        status: "rascunho",
        tenant_id: currentTenantId || "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ${isEditing ? "atualizar" : "criar"} contrato: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: ContractFormValues) => {
    setIsSubmitting(true);
    saveContract.mutate(values);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Resetar formulário quando o dialog fechar ou quando não for edição
  useEffect(() => {
    if (!open && !isEditing) {
      form.reset({
        status: "rascunho",
        tenant_id: currentTenantId || "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, form, isEditing, selectedTenantId, currentTenantId]);

  // Ao abrir novo contrato, preencher empresa se estiver vazio (primeira da lista ou filtro ativo)
  useEffect(() => {
    if (!isEditing && open && tenantsArray.length > 0 && !form.getValues("tenant_id")) {
      form.setValue("tenant_id", currentTenantId || tenantsArray[0].id);
    }
  }, [open, isEditing, tenantsArray, currentTenantId, form]);

  // Se não houver empresas disponíveis, mostrar mensagem
  if (tenantsArray.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nenhuma Empresa Disponível</DialogTitle>
            <DialogDescription>
              Você precisa ter pelo menos uma empresa cadastrada para criar contratos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Acesse a página &quot;Empresas&quot; para criar uma nova empresa.
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
          <DialogTitle>{isEditing ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize os dados do contrato. Campos obrigatórios estão marcados com *."
              : "Preencha os dados do novo contrato. Campos obrigatórios estão marcados com *."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contratante *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contratante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients && clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.nome_fantasia || client.razao_social}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Nenhum contratante cadastrado nas suas empresas
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Contrato *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2024/001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="objeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o objeto do contrato"
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
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_mensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={tenantsArray.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa">
                            {field.value && tenantsArray.find((t) => t.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {tenantsArray.map((tenant) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodicidade_reajuste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade de Reajuste (meses)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_interno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Interno</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Upload de Arquivo do Contrato */}
            <div className="space-y-2">
              <FormLabel>Arquivo do Contrato</FormLabel>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="contract-file-upload"
                    accept=".pdf,.doc,.docx"
                  />
                  <label
                    htmlFor="contract-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste o arquivo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX (máx. 10MB)
                    </span>
                  </label>
                  {isEditing && contractData && (contractData as { file_path?: string }).file_path && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Arquivo atual: {(contractData as { file_path?: string }).file_path?.split("/").pop()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione um novo arquivo para substituir
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <File className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
              <Button type="submit" disabled={isSubmitting || loadingContract}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Contrato"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
