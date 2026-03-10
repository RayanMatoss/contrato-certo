"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, FileText, AlertCircle } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";

// docshift só funciona no browser (usa DOMParser, Node) - carregar dinamicamente
const loadDocshift = () =>
  import("docshift").then((m) => ({ toHtml: m.toHtml, toDocx: m.toDocx }));

interface PdfEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
  documentId: string;
  onSuccess?: () => void;
}

export function PdfEditorDialog({
  open,
  onOpenChange,
  filePath,
  fileName,
  documentId,
  onSuccess,
}: PdfEditorDialogProps) {
  const [html, setHtml] = useState("");
  const [useFallback, setUseFallback] = useState(false);
  const [useDocshift, setUseDocshift] = useState(false); // true = preserva estrutura
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = useCallback(async () => {
    if (!open || !filePath) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: downloadError } = await supabase.storage
        .from("documents" as never)
        .download(filePath);

      if (downloadError) throw downloadError;
      if (!data) throw new Error("Arquivo não encontrado");

      const arrayBuffer = await data.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        )
      );

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // 1. Tentar PDF→DOCX via CloudConvert (preserva estrutura)
      const docxRes = await fetch("/api/documents/convert-pdf-to-docx", {
        method: "POST",
        headers,
        body: JSON.stringify({ pdfBase64: base64 }),
      });

      if (docxRes.ok) {
        const { docxBase64 } = await docxRes.json();
        const { toHtml } = await loadDocshift();
        const binary = atob(docxBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const docxBlob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const convertedHtml = await toHtml(docxBlob);
        setHtml(convertedHtml || "");
        setUseDocshift(true);
        setUseFallback(false);
        return;
      }

      // 2. Fallback: PDF→HTML via mammoth (perde formatação)
      const htmlRes = await fetch("/api/documents/convert-pdf-to-html", {
        method: "POST",
        headers,
        body: JSON.stringify({ pdfBase64: base64 }),
      });

      const json = await htmlRes.json();
      if (!htmlRes.ok) {
        throw new Error(json.error || "Erro na conversão");
      }

      setHtml(json.html || "");
      setUseDocshift(false);
      setUseFallback(!!json.useFallback);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar documento";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [open, filePath]);

  useEffect(() => {
    if (open) {
      loadPdf();
    } else {
      setHtml("");
      setError(null);
    }
  }, [open, loadPdf]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      let pdfBlob: Blob;

      if (useDocshift) {
        // DocShift no browser: HTML→DOCX, depois DOCX→PDF no servidor
        const { toDocx } = await loadDocshift();
        const docxBlob = await toDocx(html);
        const docxArrayBuffer = await docxBlob.arrayBuffer();
        const docxBase64 = btoa(
          new Uint8Array(docxArrayBuffer).reduce(
            (acc, byte) => acc + String.fromCharCode(byte),
            ""
          )
        );

        const res = await fetch("/api/documents/convert-docx-to-pdf", {
          method: "POST",
          headers,
          body: JSON.stringify({ docxBase64 }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erro na conversão");
        }

        pdfBlob = await res.blob();
      } else {
        // Fallback: HTML→PDF via html-to-docx + CloudConvert/LibreOffice
        const res = await fetch("/api/documents/convert-html-to-pdf", {
          method: "POST",
          headers,
          body: JSON.stringify({ html }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erro na conversão");
        }

        pdfBlob = await res.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from("documents" as never)
        .upload(filePath, pdfBlob, {
          cacheControl: "no-cache",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      await supabase
        .from("documents" as never)
        .update({
          file_size: pdfBlob.size,
        } as never)
        .eq("id", documentId);

      toast.success("Documento atualizado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate pr-8">
            <FileText className="h-5 w-5 flex-shrink-0" />
            Editar texto: {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {useDocshift
              ? "Documento convertido com CloudConvert + DocShift. A estrutura original será preservada ao salvar."
              : useFallback
                ? "LibreOffice não encontrado. Editando em modo texto (formatação não preservada). Configure CLOUDCONVERT_API_KEY para preservar estrutura."
                : "Edite o documento abaixo. A formatação será preservada na conversão para PDF."}
          </p>

          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive text-center max-w-md">{error}</p>
              <Button variant="outline" onClick={loadPdf}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <RichTextEditor
                content={html}
                onChange={setHtml}
                placeholder="O conteúdo do documento será exibido aqui..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving || !!error}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
