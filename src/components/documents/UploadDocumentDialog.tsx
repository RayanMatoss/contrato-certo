"use client";

import { useState, useRef, useEffect } from "react";
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
import { Loader2, Upload, X, File, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTenantSelector } from "@/hooks/use-tenant-selector";

const documentSchema = z.object({
  tenant_id: z.string().min(1, "Empresa é obrigatória"),
  name: z.string().min(1, "Nome do documento é obrigatório"),
  type: z.enum(["certidao", "assinatura", "atestado", "proposta", "procuracao", "fiscal", "comprovante", "outros"]),
  validade: z.string().optional(),
  contract_id: z.string().optional(),
  client_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

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

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string; // Opcional agora, pois pode vir do formulário
}

export function UploadDocumentDialog({ open, onOpenChange, tenantId }: UploadDocumentDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tenants, selectedTenantId: currentTenantId } = useTenantSelector();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "outros",
      tenant_id: currentTenantId || "",
    },
  });

  const selectedTenantId = form.watch("tenant_id");

  // Resetar campos dependentes quando a empresa mudar
  useEffect(() => {
    if (selectedTenantId) {
      form.setValue("contract_id", undefined);
      form.setValue("client_id", undefined);
    }
  }, [selectedTenantId, form]);

  // Buscar contratos ativos
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

  // Buscar contratantes
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

  // Mutation para fazer upload e criar registro
  const uploadDocument = useMutation({
    mutationFn: async (values: DocumentFormValues) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (!selectedFile) {
        throw new Error("Selecione um arquivo para upload");
      }

      // Gerar nome único para o arquivo
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${values.tenant_id}/${fileName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents" as never)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Criar registro no banco de dados
      const { data, error } = await supabase
        .from("documents" as never)
        .insert({
          tenant_id: values.tenant_id,
          name: values.name,
          type: values.type,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          validade: values.validade || null,
          contract_id: values.contract_id || null,
          client_id: values.client_id || null,
          observacoes: values.observacoes || null,
          created_by: user.id,
        } as never)
        .select()
        .single();

      if (error) {
        // Se der erro ao criar registro, tentar deletar o arquivo do storage
        await supabase.storage.from("documents").remove([filePath]);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      form.reset({
        type: "outros",
        tenant_id: currentTenantId || "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar documento: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: DocumentFormValues) => {
    setIsSubmitting(true);
    uploadDocument.mutate(values);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Preencher nome automaticamente se estiver vazio
      if (!form.getValues("name")) {
        form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Resetar formulário quando o dialog fechar
  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset({
        type: "outros",
        tenant_id: currentTenantId || "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
          <DialogDescription>
            Envie um documento e preencha as informações. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Aviso se não houver empresas */}
            {tenants.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Você precisa criar uma empresa antes de fazer upload de documentos.
                </span>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Arquivo *</FormLabel>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste o arquivo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB)
                    </span>
                  </label>
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

            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={tenants.length === 0}>
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="certidao">Certidão</SelectItem>
                        <SelectItem value="assinatura">Assinatura</SelectItem>
                        <SelectItem value="atestado">Atestado</SelectItem>
                        <SelectItem value="proposta">Proposta</SelectItem>
                        <SelectItem value="procuracao">Procuração</SelectItem>
                        <SelectItem value="fiscal">Fiscal</SelectItem>
                        <SelectItem value="comprovante">Comprovante</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
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
                        {contracts?.map((contract: ContractRow) => {
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
                        {clients?.map((client: ClientRow) => (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Documento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
