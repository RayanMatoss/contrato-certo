"use client";

import { useEffect, useRef, useState } from "react";
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
import { Loader2, Building2, Upload, File, X } from "lucide-react";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

const editDocumentSchema = z.object({
  tenant_id: z.string().min(1, "Empresa é obrigatória"),
  name: z.string().min(1, "Nome do documento é obrigatório"),
  type: z.enum(["certidao", "assinatura", "atestado", "proposta", "outros", "documento_empresa", "documento_representante", "contrato"]),
  validade: z.string().optional(),
  contract_id: z.string().optional(),
  client_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type EditDocumentFormValues = z.infer<typeof editDocumentSchema>;

// Tipos ativos (mesmos do upload) - sem Procuração, Fiscal, Comprovante
const ACTIVE_TYPES = ["certidao", "assinatura", "atestado", "proposta", "documento_empresa", "documento_representante", "contrato", "outros"] as const;

const categoryLabels: Record<string, string> = {
  certidao: "Certidão",
  assinatura: "Assinatura",
  atestado: "Atestado",
  proposta: "Proposta",
  outros: "Outros",
  documento_empresa: "Documento da empresa",
  documento_representante: "Documento do Representante",
  contrato: "Contrato",
};

type UUID = string;

interface ContractRow {
  id: UUID;
  numero: string;
  clients?: {
    id: UUID;
    razao_social?: string;
    nome_fantasia?: string | null;
  } | null;
}

interface ClientRow {
  id: UUID;
  razao_social: string;
  nome_fantasia?: string | null;
}

interface Document {
  id: string;
  name: string;
  type: string;
  validade: string | null;
  tenant_id?: string;
  file_path?: string | null;
  file_size?: number | null;
  contract_id?: string | null;
  client_id?: string | null;
  observacoes?: string | null;
}

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  tenantFilter: string | null;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  document,
  tenantFilter,
}: EditDocumentDialogProps) {
  const queryClient = useQueryClient();
  const { tenants, selectedTenantId: currentTenantId } = useTenantSelector();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditDocumentFormValues>({
    resolver: zodResolver(editDocumentSchema),
    defaultValues: {
      tenant_id: "",
      name: "",
      type: "outros",
      validade: "",
      contract_id: "",
      client_id: "",
      observacoes: "",
    },
  });

  const selectedTenantId = form.watch("tenant_id");

  useEffect(() => {
    if (document && open) {
      // Tipos antigos (procuracao, fiscal, comprovante) mapeiam para "outros"
      const type = ACTIVE_TYPES.includes(document.type as typeof ACTIVE_TYPES[number])
        ? document.type
        : "outros";

      form.reset({
        tenant_id: document.tenant_id || currentTenantId || tenants[0]?.id || "",
        name: document.name,
        type: type as EditDocumentFormValues["type"],
        validade: document.validade ? document.validade.split("T")[0] : "",
        contract_id: document.contract_id || undefined,
        client_id: document.client_id || undefined,
        observacoes: document.observacoes || "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [document, open, currentTenantId, tenants, form]);

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      const { data, error } = await supabase
        .from("contracts" as never)
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

  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients", selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      const { data, error } = await supabase
        .from("clients" as never)
        .select("id, razao_social, nome_fantasia")
        .eq("tenant_id", selectedTenantId)
        .eq("status", "ativo")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
    enabled: open && !!selectedTenantId,
  });

  const updateDocument = useMutation({
    mutationFn: async (values: EditDocumentFormValues) => {
      const updateData: Record<string, unknown> = {
        tenant_id: values.tenant_id,
        name: values.name,
        type: values.type,
        validade: values.validade || null,
        contract_id: values.contract_id || null,
        client_id: values.client_id || null,
        observacoes: values.observacoes || null,
      };

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${values.tenant_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents" as never)
          .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        if (document?.file_path) {
          await supabase.storage.from("documents" as never).remove([document.file_path]);
        }

        updateData.file_path = filePath;
        updateData.file_size = selectedFile.size;
        updateData.mime_type = selectedFile.type;
      }

      const { error } = await supabase
        .from("documents" as never)
        .update(updateData as never)
        .eq("id", document!.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Documento atualizado com sucesso!");
      await queryClient.refetchQueries({ queryKey: ["documents", tenantFilter] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const onSubmit = (values: EditDocumentFormValues) => {
    if (!document) return;
    updateDocument.mutate(values);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
          <DialogDescription>
            Corrija os dados do documento. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa *</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("contract_id", undefined);
                      form.setValue("client_id", undefined);
                    }}
                    value={field.value}
                    disabled={tenants.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Selecione uma empresa" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Arquivo</FormLabel>
              {document?.file_path ? (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <File className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Arquivo vinculado</p>
                      <p className="text-xs text-muted-foreground">
                        {document.file_size ? `${(document.file_size / 1024).toFixed(2)} KB` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSelectedFile(f);
                      }}
                      className="hidden"
                      id="edit-file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? "Trocar" : "Substituir"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedFile(f);
                    }}
                    className="hidden"
                    id="edit-file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="edit-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Este documento não possui arquivo. Clique para anexar.
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB)
                      </span>
                    </label>
                  )}
                </div>
              )}
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  O novo arquivo será vinculado ao salvar.
                </p>
              )}
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Documento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Certidão Negativa de Débitos" {...field} />
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
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVE_TYPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {categoryLabels[value]}
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
                name="validade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                      disabled={loadingContracts || !selectedTenantId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contrato (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(contracts as ContractRow[] | undefined)?.map((contract: ContractRow) => {
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
                      disabled={loadingClients || !selectedTenantId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contratante (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(clients as ClientRow[] | undefined)?.map((client: ClientRow) => (
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
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o documento"
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateDocument.isPending}>
                {updateDocument.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
