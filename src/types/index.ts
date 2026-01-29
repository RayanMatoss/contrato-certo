// Core types for the Licity SaaS

export type UserRole = 'admin' | 'financeiro' | 'operacional' | 'leitura';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  email?: string;
  email_cobranca?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export type ContractStatus = 'rascunho' | 'ativo' | 'suspenso' | 'encerrado' | 'cancelado';
export type AdjustmentIndex = 'IPCA' | 'IGPM' | 'INPC' | 'Outro';

export interface Contract {
  id: string;
  tenant_id: string;
  client_id: string;
  numero: string;
  objeto: string;
  valor_total: number;
  valor_mensal?: number;
  data_inicio: string;
  data_fim: string;
  status: ContractStatus;
  indice_reajuste?: AdjustmentIndex;
  periodicidade_reajuste?: number; // meses
  responsavel_interno?: string;
  dados_bancarios?: string;
  sla?: string;
  observacoes?: string;
  file_path?: string;
  file_size?: number;
  file_mime_type?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 
  | 'a_emitir' 
  | 'emitida' 
  | 'enviada' 
  | 'em_cobranca' 
  | 'parcial' 
  | 'paga' 
  | 'vencida' 
  | 'cancelada';

export interface Invoice {
  id: string;
  tenant_id: string;
  contract_id: string;
  client_id: string;
  competencia: string; // YYYY-MM
  numero_nf?: string;
  chave_nf?: string;
  data_previsao_emissao?: string;
  data_emissao?: string;
  data_vencimento: string;
  valor_bruto: number;
  valor_impostos?: number;
  valor_liquido: number;
  retencoes?: number;
  status: InvoiceStatus;
  link_pdf?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
export type TaskType = 
  | 'emissao_nf' 
  | 'envio_nf' 
  | 'cobranca' 
  | 'renovacao_contrato' 
  | 'renovacao_certidao' 
  | 'outros';

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  due_date?: string;
  contract_id?: string;
  client_id?: string;
  invoice_id?: string;
  assigned_to?: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType = 
  | 'certidao' 
  | 'assinatura' 
  | 'atestado' 
  | 'proposta' 
  | 'procuracao' 
  | 'fiscal' 
  | 'comprovante' 
  | 'outros';

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  type: DocumentType;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  tags?: string[];
  validade?: string;
  contract_id?: string;
  client_id?: string;
  invoice_id?: string;
  version: number;
  observacoes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  tenant_id: string;
  name: string;
  type: 'receita' | 'despesa';
  parent_id?: string;
  created_at: string;
}

export interface CostCenter {
  id: string;
  tenant_id: string;
  name: string;
  code?: string;
  active: boolean;
  created_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  contractsExpiringSoon: number;
  invoicesToIssue: number;
  overdueInvoices: number;
  receivablesThisMonth: number;
  forecast30Days: number;
  forecast60Days: number;
}

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}
