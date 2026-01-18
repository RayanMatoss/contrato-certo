import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  expiresIn: number; // days
  client?: string;
}

// Dados mockados removidos - agora buscamos do Supabase
const documents: Document[] = [];

function getExpirationVariant(days: number): "danger" | "warning" | "muted" {
  if (days <= 7) return "danger";
  if (days <= 15) return "warning";
  return "muted";
}

function getExpirationBg(days: number): string {
  if (days <= 7) return "bg-destructive/10 border-destructive/20";
  if (days <= 15) return "bg-warning/10 border-warning/20";
  return "bg-muted/50 border-border";
}

export function ExpiringDocuments() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Documentos a Vencer</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {documents.map((doc) => {
            const variant = getExpirationVariant(doc.expiresIn);
            return (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
                  getExpirationBg(doc.expiresIn)
                )}
              >
                <div className="rounded-lg p-2 bg-background">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type}
                    {doc.client && ` • ${doc.client}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1",
                    variant === "danger" && "border-destructive/20 text-destructive",
                    variant === "warning" && "border-warning/20 text-warning",
                    variant === "muted" && "border-border text-muted-foreground"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {doc.expiresIn}d
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
