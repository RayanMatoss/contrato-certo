"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, ExternalLink, Eye, Pencil, FilePen } from "lucide-react";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  fileName: string;
  /** Altera quando o arquivo é atualizado (ex: file_size) - força novo fetch */
  cacheBuster?: string | number;
  onEdit?: () => void;
  onEditText?: () => void;
}

const PREVIEWABLE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "gif", "webp"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function getExtension(path: string): string {
  const parts = path.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  filePath,
  fileName,
  cacheBuster,
  onEdit,
  onEditText,
}: DocumentPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Baixar arquivo e criar blob URL (igual ao upload) - evita CORS/iframe com signed URL
  useEffect(() => {
    if (!open || !filePath) {
      setPreviewUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.storage
      .from("documents" as never)
      .download(filePath)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        setLoading(false);
        if (err) {
          setError(err.message);
          toast.error(`Erro ao carregar preview: ${err.message}`);
          return;
        }
        if (data) {
          const url = URL.createObjectURL(data);
          blobUrlRef.current = url;
          setPreviewUrl(url);
        } else {
          setError("Arquivo não encontrado");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false);
          const msg = err?.message || "Erro ao carregar";
          setError(msg);
          toast.error(`Erro ao carregar preview: ${msg}`);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, filePath, cacheBuster]);

  const handleDownload = async () => {
    if (!filePath) return;
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
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao baixar: ${msg}`);
    }
  };

  const ext = filePath ? getExtension(filePath) : "";
  const canPreview = PREVIEWABLE_EXTENSIONS.includes(ext);
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  const hasNoFile = open && !filePath;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
        </DialogHeader>

        {hasNoFile ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
            <p className="text-muted-foreground">
              Este documento não possui arquivo vinculado.
            </p>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar documento
              </Button>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
            <p className="text-destructive">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar documento
              </Button>
            </div>
          </div>
        ) : previewUrl && canPreview ? (
          <div className="space-y-3">
            {/* Mesmo layout do upload: header Pré-visualização */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pré-visualização</span>
                </div>
                <div className="flex items-center gap-2">
                  {onEditText && ext === "pdf" && (
                    <Button variant="outline" size="sm" onClick={onEditText}>
                      <FilePen className="h-4 w-4 mr-2" />
                      Editar texto
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
              <div className="relative w-full bg-gray-50 dark:bg-muted/30" style={{ height: "500px" }}>
                {isImage ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={fileName}
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <p className="text-muted-foreground text-sm">
              Visualização não disponível para este tipo de arquivo.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  a.click();
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        ) : !loading && !error && !previewUrl ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
            <p className="text-muted-foreground">
              Não foi possível carregar o documento.
            </p>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Tentar baixar
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
