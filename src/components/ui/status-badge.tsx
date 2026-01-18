import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "muted";

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "status-badge status-success",
  warning: "status-badge status-warning",
  danger: "status-badge status-danger",
  info: "status-badge status-info",
  muted: "status-badge status-muted",
};

export function StatusBadge({ label, variant, className, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn(variantStyles[variant], className)}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "danger" && "bg-destructive",
            variant === "info" && "bg-info",
            variant === "muted" && "bg-muted-foreground"
          )}
        />
      )}
      {label}
    </span>
  );
}

// Utility function to get status variant from contract/invoice status
export function getContractStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "ativo":
      return "success";
    case "rascunho":
      return "muted";
    case "suspenso":
      return "warning";
    case "encerrado":
    case "cancelado":
      return "danger";
    default:
      return "muted";
  }
}

export function getInvoiceStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "paga":
      return "success";
    case "emitida":
    case "enviada":
      return "info";
    case "a_emitir":
    case "em_cobranca":
    case "parcial":
      return "warning";
    case "vencida":
    case "cancelada":
      return "danger";
    default:
      return "muted";
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    // Contract status
    rascunho: "Rascunho",
    ativo: "Ativo",
    suspenso: "Suspenso",
    encerrado: "Encerrado",
    cancelado: "Cancelado",
    // Invoice status
    a_emitir: "A Emitir",
    emitida: "Emitida",
    enviada: "Enviada",
    em_cobranca: "Em Cobrança",
    parcial: "Parcial",
    paga: "Paga",
    vencida: "Vencida",
    // Task status
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    concluida: "Concluída",
  };
  return labels[status] || status;
}
