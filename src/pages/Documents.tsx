"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";
import { toast } from "sonner";

// Dynamic import para reduzir bundle inicial - dialog só carrega quando necessário
const UploadDocumentDialog = dynamic(() => import("@/components/documents/UploadDocumentDialog").then(mod => ({ default: mod.UploadDocumentDialog })), { ssr: false });
const EditDocumentDialog = dynamic(() => import("@/components/documents/EditDocumentDialog").then(mod => ({ default: mod.EditDocumentDialog })), { ssr: false });
const DocumentPreviewDialog = dynamic(() => import("@/components/documents/DocumentPreviewDialog").then(mod => ({ default: mod.DocumentPreviewDialog })), { ssr: false });
const PdfEditorDialog = dynamic(() => import("@/components/documents/PdfEditorDialog").then(mod => ({ default: mod.PdfEditorDialog })), { ssr: false });
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter,
  Upload,
  Loader2,
  FolderOpen,
  FileText,
  File,
  FileSpreadsheet,
  MoreHorizontal,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  file_path?: string | null;
  file_size: number | null;
  validade: string | null;
  created_at: string;
  updated_at?: string;
  tenant_id?: string;
  contract_id?: string | null;
  client_id?: string | null;
  observacoes?: string | null;
  tenantName?: string;
  client?: {
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
  contract?: {
    numero: string;
  } | null;
}

const categoryLabels: Record<string, string> = {
  certidao: "Certidão",
  assinatura: "Assinatura",
  atestado: "Atestado",
  proposta: "Proposta",
  outros: "Outros",
  documento_empresa: "Documento da empresa",
  documento_representante: "Documento do Representante",
  contrato: "Contrato",
  // Legado - documentos existentes
  procuracao: "Procuração",
  fiscal: "Fiscal",
  comprovante: "Comprovante",
};

const categoryIcons: Record<string, typeof FileText> = {
  certidao: FileText,
  assinatura: File,
  atestado: FileText,
  proposta: FileSpreadsheet,
  outros: File,
  documento_empresa: FileText,
  documento_representante: FileText,
  contrato: FileText,
  procuracao: FileText,
  fiscal: FileText,
  comprovante: FileText,
};

function getStatusIcon(status: string) {
  switch (status) {
    case "valido":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "expirando":
      return <Clock className="h-4 w-4 text-warning" />;
    case "expirado":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "valido":
      return "Válido";
    case "expirando":
      return "Expirando";
    case "expirado":
      return "Expirado";
    default:
      return status;
  }
}

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ filePath: string | null | undefined; fileName: string; document: Document } | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [pdfEditorDoc, setPdfEditorDoc] = useState<{ filePath: string; fileName: string; document: Document } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [showExpiredDocs, setShowExpiredDocs] = useState(false); // "pasta" de expirados oculta por padrão

  const { tenantId, isLoading: loadingTenant } = useTenant();
  const { tenants } = useTenantSelector();
  const queryClient = useQueryClient();

  // Buscar documentos do Supabase - de todas as empresas ou filtrado
  const { data: documentsData, isLoading: loadingDocuments } = useQuery({
    queryKey: ["documents", tenantFilter],
    queryFn: async () => {
      // Obter tenant_ids para buscar
      const tenantIds = tenantFilter 
        ? [tenantFilter] 
        : tenants.map((t) => t.id);
      
      if (tenantIds.length === 0) return [];

      const { data, error } = await supabase
        .from("documents" as never)
        .select(`
          id,
          name,
          type,
          file_path,
          file_size,
          validade,
          tenant_id,
          contract_id,
          client_id,
          observacoes,
          created_at,
          updated_at,
          clients:client_id (
            razao_social,
            nome_fantasia
          ),
          contracts:contract_id (
            numero
          ),
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((doc: {
        id: string;
        name: string;
        type: string;
        file_path: string;
        file_size?: number;
        validade?: string;
        tenant_id: string;
        contract_id?: string | null;
        client_id?: string | null;
        observacoes?: string | null;
        created_at: string;
        clients?: { razao_social?: string; nome_fantasia?: string } | null;
        contracts?: { numero?: string } | null;
        tenants?: { id: string; name: string; slug: string } | null;
      }) => ({
        ...doc,
        tenantName: doc.tenants?.name || "Empresa não encontrada",
      })) as Document[];
    },
    enabled: !loadingTenant && tenants.length > 0,
  });

  const documents: Document[] = useMemo(() => {
    return documentsData || [];
  }, [documentsData]);

  // Calcular status dos documentos
  const getDocumentStatus = (validade: string | null): "valido" | "expirando" | "expirado" => {
    if (!validade) return "valido";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(validade);
    expiryDate.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return "expirado";
    if (daysUntilExpiry <= 30) return "expirando";
    return "valido";
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || doc.type === categoryFilter;
      const status = getDocumentStatus(doc.validade);
      const isExpired = status === "expirado";
      // Por padrão, expirados ficam "na pasta" - só aparecem quando showExpiredDocs
      if (showExpiredDocs) {
        return matchesSearch && matchesCategory && isExpired;
      }
      return matchesSearch && matchesCategory && !isExpired;
    });
  }, [documents, searchTerm, categoryFilter, showExpiredDocs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Summary stats
  const validCount = documents.filter((d) => getDocumentStatus(d.validade) === "valido").length;
  const expiringCount = documents.filter((d) => getDocumentStatus(d.validade) === "expirando").length;
  const expiredCount = documents.filter((d) => getDocumentStatus(d.validade) === "expirado").length;

  // Mutation para deletar documento
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // Buscar o documento para obter o file_path
      const { data: doc, error: fetchError } = await supabase
        .from("documents" as never)
        .select("file_path")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      // Deletar do storage
      const typedDoc = doc as { file_path?: string } | null;
      if (typedDoc?.file_path) {
        const { error: storageError } = await supabase.storage
          .from("documents" as never)
          .remove([typedDoc.file_path]);

        if (storageError) throw storageError;
      }

      // Deletar do banco
      const { error } = await supabase
        .from("documents" as never)
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["documents", tenantFilter] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir documento: ${error.message}`);
    },
  });

  const selectedDocsWithFile = useMemo(() => {
    return filteredDocuments.filter(
      (d) => selectedIds.has(d.id) && d.file_path
    );
  }, [filteredDocuments, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const docsWithFile = filteredDocuments.filter((d) => d.file_path);
    if (selectedIds.size >= docsWithFile.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(docsWithFile.map((d) => d.id)));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocsWithFile.length === 0) return;
    setDownloadingBulk(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const doc of selectedDocsWithFile) {
        if (!doc.file_path) continue;
        const { data, error } = await supabase.storage
          .from("documents" as never)
          .download(doc.file_path);
        if (error || !data) continue;
        // Usar extensão do file_path (ex: tenant/arquivo.pdf) ou do nome; fallback: pdf
        const pathExt = doc.file_path.includes(".") ? doc.file_path.split(".").pop()?.toLowerCase() : null;
        const nameExt = doc.name.includes(".") ? doc.name.split(".").pop()?.toLowerCase() : null;
        const ext = nameExt || pathExt || "pdf";
        const baseName = doc.name.replace(/\.[^/.]+$/, "") || doc.name;
        let fileName = `${baseName}.${ext}`;
        let counter = 1;
        while (zip.file(fileName)) {
          fileName = `${baseName} (${counter}).${ext}`;
          counter++;
        }
        zip.file(fileName, await data.arrayBuffer());
      }

      const blob = (await zip.generateAsync({ type: "blob" })) as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documentos-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${selectedDocsWithFile.length} documento(s) baixado(s) em ZIP`);
      setSelectedIds(new Set());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar";
      toast.error(msg);
    } finally {
      setDownloadingBulk(false);
    }
  };

  // Função para download
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents" as never)
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error("Arquivo não encontrado");

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao baixar documento: ${errorMessage}`);
    }
  };

  return (
    <AppLayout>
      <div className="p-2 sm:p-3 md:p-6 space-y-2 sm:space-y-3 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">Documentos</h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
              Gestão de certidões, atestados e documentos fiscais
            </p>
          </div>
          <Button className="gap-1.5 sm:gap-2 w-full sm:w-auto h-9 sm:h-10 text-sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Upload Documento</span>
          </Button>
        </div>

        {/* Summary Cards - More compact on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
          <Card className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-muted flex-shrink-0">
                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{documents.length}</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight truncate">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-success/10 flex-shrink-0">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{validCount}</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight truncate">Válidos</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-warning/10 flex-shrink-0">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{expiringCount}</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight truncate">Expirando</p>
              </div>
            </div>
          </Card>
          <Card
            className={cn(
              "p-2 sm:p-3 md:p-4 transition-colors",
              expiredCount > 0 && "cursor-pointer hover:bg-destructive/5",
              showExpiredDocs && "ring-2 ring-destructive/50"
            )}
            onClick={() => {
              if (expiredCount > 0) {
                setShowExpiredDocs((v) => !v);
                setSelectedIds(new Set());
              }
            }}
          >
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
                <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{expiredCount}</p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight truncate">
                    {showExpiredDocs ? "Expirados (visível)" : "Expirados"}
                  </p>
                </div>
              </div>
              {expiredCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs shrink-0 h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExpiredDocs((v) => !v);
                    setSelectedIds(new Set());
                  }}
                >
                  {showExpiredDocs ? "Ocultar" : "Ver expiradas"}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="certidao">Certidões</SelectItem>
                    <SelectItem value="assinatura">Assinaturas</SelectItem>
                    <SelectItem value="atestado">Atestados</SelectItem>
                    <SelectItem value="proposta">Propostas</SelectItem>
                    <SelectItem value="documento_empresa">Documento da empresa</SelectItem>
                    <SelectItem value="documento_representante">Documento do Representante</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TenantFilter
                value={tenantFilter}
                onValueChange={setTenantFilter}
                className="w-full sm:w-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Banner quando visualizando pasta de expirados */}
        {showExpiredDocs && expiredCount > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Pasta Expirados — {expiredCount} documento(s)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowExpiredDocs(false);
                setSelectedIds(new Set());
              }}
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Barra de ações - aparece acima da tabela quando há seleção */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-primary/5">
            <span className="text-sm font-medium">
              {selectedIds.size} documento(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Desmarcar
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleBulkDownload}
                disabled={downloadingBulk || selectedDocsWithFile.length === 0}
              >
                {downloadingBulk ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar
              </Button>
            </div>
          </div>
        )}

        {/* Documents Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto -mx-2 sm:-mx-3 md:mx-0">
            <div className="min-w-[550px] sm:min-w-[600px] md:min-w-[700px]">
              <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-2 py-2 sm:py-3">
                    <Checkbox
                      checked={
                        (filteredDocuments.filter((d) => d.file_path).length > 0 &&
                          selectedIds.size >= filteredDocuments.filter((d) => d.file_path).length)
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Documento</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3 hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell px-3 md:px-4 text-xs sm:text-sm py-2 md:py-3">Empresa</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Upload</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Validade/Vigência</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Status</TableHead>
                  <TableHead className="w-[35px] sm:w-[40px] md:w-[50px] px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDocuments || loadingTenant ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando documentos...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {showExpiredDocs
                        ? "Nenhum documento expirado encontrado."
                        : "Nenhum documento encontrado. Clique em \"Upload Documento\" para começar."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const CategoryIcon = categoryIcons[doc.type] || File;
                    const status = getDocumentStatus(doc.validade);
                    
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="w-10 px-2 py-2 sm:py-3">
                          {doc.file_path ? (
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={() => toggleSelect(doc.id)}
                              aria-label={`Selecionar ${doc.name}`}
                            />
                          ) : (
                            <span className="inline-block w-4 h-4" />
                          )}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                            <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-muted flex-shrink-0">
                              <CategoryIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[11px] sm:text-xs md:text-sm truncate">{doc.name}</p>
                              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5">{categoryLabels[doc.type] || doc.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3">
                          <div className="max-w-[150px] truncate text-xs md:text-sm">
                            {doc.tenantName || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-3">{formatDate(doc.created_at)}</TableCell>
                        <TableCell className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                          {doc.validade ? (
                            <span className={cn(
                              status === "expirado" && "text-destructive font-medium",
                              status === "expirando" && "text-warning font-medium"
                            )}>
                              {formatDate(doc.validade)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                            {getStatusIcon(status)}
                            <span className={cn(
                              "text-[10px] sm:text-xs md:text-sm truncate",
                              status === "valido" && "text-success",
                              status === "expirando" && "text-warning",
                              status === "expirado" && "text-destructive"
                            )}>
                              {getStatusLabel(status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 sm:px-2 md:px-4 py-2 sm:py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
                                <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setPreviewDoc({ filePath: doc.file_path ?? null, fileName: doc.name, document: doc });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setEditDoc(doc);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (doc.file_path) handleDownload(doc.file_path, doc.name);
                                  else toast.error("Este documento não possui arquivo para download.");
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (confirm("Tem certeza que deseja excluir este documento?")) {
                                    deleteDocument.mutate(doc.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Document Dialog - Defer: só renderiza quando aberto */}
      {isUploadDialogOpen && (
        <UploadDocumentDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          tenantId={tenantId}
        />
      )}

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        filePath={previewDoc?.filePath ?? null}
        fileName={previewDoc?.fileName ?? ""}
        cacheBuster={previewDoc?.document?.updated_at ?? previewDoc?.document?.file_size ?? ""}
        onEdit={() => {
          if (previewDoc?.document) {
            setEditDoc(previewDoc.document);
            setPreviewDoc(null);
          }
        }}
        onEditText={() => {
          if (previewDoc?.document?.file_path && previewDoc?.document?.tenant_id) {
            setPdfEditorDoc({
              filePath: previewDoc.document.file_path,
              fileName: previewDoc.fileName,
              document: previewDoc.document,
            });
            setPreviewDoc(null);
          }
        }}
      />

      {pdfEditorDoc && (
        <PdfEditorDialog
          open={!!pdfEditorDoc}
          onOpenChange={(open) => !open && setPdfEditorDoc(null)}
          filePath={pdfEditorDoc.filePath}
          fileName={pdfEditorDoc.fileName}
          documentId={pdfEditorDoc.document.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["documents", tenantFilter] });
          }}
        />
      )}

      {/* Edit Document Dialog */}
      <EditDocumentDialog
        open={!!editDoc}
        onOpenChange={(open) => !open && setEditDoc(null)}
        document={editDoc}
        tenantFilter={tenantFilter}
      />
    </AppLayout>
  );
}
