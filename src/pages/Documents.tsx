"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { toast } from "sonner";
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
  FolderOpen,
  FileText,
  File,
  FileSpreadsheet,
  MoreHorizontal,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  file_path: string;
  file_size: number | null;
  validade: string | null;
  created_at: string;
  tenant_id?: string;
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
  procuracao: "Procuração",
  fiscal: "Fiscal",
  comprovante: "Comprovante",
  outros: "Outros",
};

const categoryIcons: Record<string, typeof FileText> = {
  certidao: FileText,
  assinatura: File,
  atestado: FileText,
  proposta: FileSpreadsheet,
  procuracao: FileText,
  fiscal: FileText,
  comprovante: FileText,
  outros: File,
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
  const hasInitializedFilter = useRef(false);
  
  const { tenantId, isLoading: loadingTenant } = useTenant();
  const { tenants, selectedTenantId } = useTenantSelector();
  const queryClient = useQueryClient();

  // Inicializar filtro com a empresa selecionada
  useEffect(() => {
    if (selectedTenantId && !hasInitializedFilter.current) {
      setTenantFilter(selectedTenantId);
      hasInitializedFilter.current = true;
    }
  }, [selectedTenantId]);

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
          created_at,
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
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, categoryFilter]);

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
          <Card className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{expiredCount}</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight truncate">Expirados</p>
              </div>
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
                    <SelectItem value="procuracao">Procurações</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="comprovante">Comprovantes</SelectItem>
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

        {/* Documents Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto -mx-2 sm:-mx-3 md:mx-0">
            <div className="min-w-[550px] sm:min-w-[600px] md:min-w-[700px]">
              <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Documento</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3 hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell px-3 md:px-4 text-xs sm:text-sm py-2 md:py-3">Empresa</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Upload</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3 hidden xs:table-cell">Validade</TableHead>
                  <TableHead className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm py-2 sm:py-3">Status</TableHead>
                  <TableHead className="w-[35px] sm:w-[40px] md:w-[50px] px-1 sm:px-2 md:px-4 py-2 sm:py-3"></TableHead>
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum documento encontrado. Clique em &quot;Upload Documento&quot; para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const CategoryIcon = categoryIcons[doc.type] || File;
                    const status = getDocumentStatus(doc.validade);
                    
                    return (
                      <TableRow key={doc.id}>
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
                        <TableCell className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden xs:table-cell">
                          {doc.validade ? formatDate(doc.validade) : "-"}
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
                                  handleDownload(doc.file_path, doc.name);
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

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        tenantId={tenantId}
      />
    </AppLayout>
  );
}
