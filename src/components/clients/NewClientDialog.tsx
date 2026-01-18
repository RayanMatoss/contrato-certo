"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const clientSchema = z.object({
  razao_social: z.string().min(1, "Razão social é obrigatória"),
  nome_fantasia: z.string().default(""),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")).default(""),
  telefone: z.string().default(""),
  cidade: z.string().default(""),
  uf: z.string().length(2, "UF deve ter 2 caracteres").or(z.literal("")).default(""),
  status: z.enum(["ativo", "inativo"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  clientId?: string; // Para edição
}

export function NewClientDialog({ open, onOpenChange, tenantId, clientId }: NewClientDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      email: "",
      telefone: "",
      cidade: "",
      uf: "",
      status: "ativo",
    },
  });

  // Buscar contratante para edição
  useEffect(() => {
    if (open && clientId) {
      supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          if (data) {
            form.reset({
              razao_social: data.razao_social || "",
              nome_fantasia: data.nome_fantasia || "",
              cnpj: data.cnpj || "",
              email: data.email || "",
              telefone: data.telefone || "",
              cidade: data.cidade || "",
              uf: data.uf || "",
              status: (data.status as "ativo" | "inativo") || "ativo",
            });
          }
        });
    } else if (open && !clientId) {
      form.reset({
        razao_social: "",
        nome_fantasia: "",
        cnpj: "",
        email: "",
        telefone: "",
        cidade: "",
        uf: "",
        status: "ativo",
      });
    }
  }, [open, clientId, form]);

  // Mutation para criar/atualizar contratante
  const createOrUpdateClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const clientData = {
        tenant_id: tenantId,
        razao_social: values.razao_social,
        nome_fantasia: values.nome_fantasia || null,
        cnpj: values.cnpj,
        email: values.email || null,
        telefone: values.telefone || null,
        cidade: values.cidade || null,
        uf: values.uf || null,
        status: values.status,
      };

      if (clientId) {
        // Atualizar
        const { data, error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", clientId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar
        const { data, error } = await supabase
          .from("clients")
          .insert(clientData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", tenantId] });
      toast.success(clientId ? "Contratante atualizado com sucesso!" : "Contratante criado com sucesso!");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar contratante");
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    createOrUpdateClient.mutate(values);
    setIsSubmitting(false);
  };

  // Resetar formulário quando o dialog fechar
  useEffect(() => {
    if (!open) {
      form.reset({
        razao_social: "",
        nome_fantasia: "",
        cnpj: "",
        email: "",
        telefone: "",
        cidade: "",
        uf: "",
        status: "ativo",
      });
    }
  }, [open, form]);

  const ufOptions = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{clientId ? "Editar Contratante" : "Novo Contratante"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do contratante. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social completa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a UF" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ufOptions.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  clientId ? "Atualizar" : "Criar Contratante"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
