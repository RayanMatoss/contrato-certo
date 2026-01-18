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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const tenantSchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  cnpj: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

interface NewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string; // Para edição
}

export function NewTenantDialog({ open, onOpenChange, tenantId }: NewTenantDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      cnpj: "",
    },
  });

  // Buscar tenant para edição
  useEffect(() => {
    if (open && tenantId) {
      const tableName = "tenants" as never;
      supabase
        .from(tableName)
        .select("*")
        .eq("id", tenantId)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          if (data) {
            const tenantData = data as { name?: string; slug?: string; cnpj?: string };
            form.reset({
              name: tenantData.name || "",
              slug: tenantData.slug || "",
              cnpj: tenantData.cnpj || "",
            });
          }
        });
    } else if (open && !tenantId) {
      form.reset({
        name: "",
        slug: "",
        cnpj: "",
      });
    }
  }, [open, tenantId, form]);

  // Mutation para criar/atualizar tenant
  const saveTenant = useMutation({
    mutationFn: async (values: TenantFormValues) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (tenantId) {
        // Atualizar tenant existente
        const tableName = "tenants" as never;
        const { data, error } = await supabase
          .from(tableName)
          .update({
            name: values.name,
            slug: values.slug,
            cnpj: values.cnpj || null,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", tenantId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo tenant
        const tableName = "tenants" as never;
        const { data: tenantData, error: tenantError } = await supabase
          .from(tableName)
          .insert({
            name: values.name,
            slug: values.slug,
            cnpj: values.cnpj || null,
          } as never)
          .select()
          .single();

        if (tenantError) throw tenantError;
        if (!tenantData) throw new Error("Erro ao criar empresa");

        // Criar membership como admin
        const typedTenantData = tenantData as { id: string };
        const membershipTableName = "tenant_memberships" as never;
        const { error: membershipError } = await supabase
          .from(membershipTableName)
          .insert({
            tenant_id: typedTenantData.id,
            user_id: user.id,
            role: "admin",
          } as never);

        if (membershipError) {
          // Se der erro ao criar membership, tentar deletar o tenant
          const deleteTableName = "tenants" as never;
          await supabase.from(deleteTableName).delete().eq("id", typedTenantData.id);
          throw membershipError;
        }

        return tenantData;
      }
    },
    onSuccess: () => {
      toast.success(tenantId ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user-tenants"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || (tenantId ? "Erro ao atualizar empresa" : "Erro ao criar empresa"));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: TenantFormValues) => {
    setIsSubmitting(true);
    saveTenant.mutate(values);
  };

  // Gerar slug automaticamente a partir do nome
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!tenantId) {
      // Apenas gerar slug automaticamente ao criar (não ao editar)
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tenantId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da empresa. Campos obrigatórios estão marcados com *.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Minha Empresa LTDA"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: minha-empresa"
                      {...field}
                      disabled={!!tenantId} // Desabilitar slug ao editar
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    O slug é usado na URL e não pode ser alterado após a criação.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tenantId ? "Atualizar" : "Criar Empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
