-- ============================================
-- Migration 001: Initial Schema
-- Criação de ENUMs, Extensões e Tabelas Base
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMs
-- ============================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'financeiro', 'operacional', 'leitura');

-- Contract status
CREATE TYPE contract_status AS ENUM ('rascunho', 'ativo', 'suspenso', 'encerrado', 'cancelado');

-- Adjustment index
CREATE TYPE adjustment_index AS ENUM ('IPCA', 'IGPM', 'INPC', 'Outro');

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'a_emitir',
  'emitida',
  'enviada',
  'em_cobranca',
  'parcial',
  'paga',
  'vencida',
  'cancelada'
);

-- Task status
CREATE TYPE task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Task type
CREATE TYPE task_type AS ENUM (
  'emissao_nf',
  'envio_nf',
  'cobranca',
  'renovacao_contrato',
  'renovacao_certidao',
  'outros'
);

-- Document type
CREATE TYPE document_type AS ENUM (
  'certidao',
  'assinatura',
  'atestado',
  'proposta',
  'procuracao',
  'fiscal',
  'comprovante',
  'outros'
);

-- Financial type
CREATE TYPE financial_type AS ENUM ('receita', 'despesa');

-- ============================================
-- Tabelas de Sistema Multi-Tenant
-- ============================================

-- Tenants (Empresas/Organizações)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Extensão da tabela auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Memberships (Relação usuário-tenant com roles)
CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'leitura',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================
-- Tabelas de Negócio
-- ============================================

-- Clients (Clientes)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL,
  email TEXT,
  email_cobranca TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, cnpj)
);

-- Contracts (Contratos)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  objeto TEXT NOT NULL,
  valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total >= 0),
  valor_mensal NUMERIC(15, 2) CHECK (valor_mensal >= 0),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status contract_status NOT NULL DEFAULT 'rascunho',
  indice_reajuste adjustment_index,
  periodicidade_reajuste INTEGER CHECK (periodicidade_reajuste > 0),
  responsavel_interno TEXT,
  dados_bancarios TEXT,
  sla TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero),
  CHECK (data_fim >= data_inicio)
);

-- Invoices (Notas Fiscais)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- YYYY-MM format
  numero_nf TEXT,
  chave_nf TEXT,
  data_previsao_emissao DATE,
  data_emissao DATE,
  data_vencimento DATE NOT NULL,
  valor_bruto NUMERIC(15, 2) NOT NULL CHECK (valor_bruto >= 0),
  valor_impostos NUMERIC(15, 2) DEFAULT 0 CHECK (valor_impostos >= 0),
  valor_liquido NUMERIC(15, 2) NOT NULL CHECK (valor_liquido >= 0),
  retencoes NUMERIC(15, 2) DEFAULT 0 CHECK (retencoes >= 0),
  status invoice_status NOT NULL DEFAULT 'a_emitir',
  link_pdf TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks (Tarefas)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'pendente',
  due_date DATE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (Documentos)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  tags TEXT[],
  validade DATE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Categories (Categorias Financeiras)
CREATE TABLE financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type financial_type NOT NULL,
  parent_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cost Centers (Centros de Custo)
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Índices para Performance
-- ============================================

-- Índices em tenant_id (todas as tabelas)
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_financial_categories_tenant_id ON financial_categories(tenant_id);
CREATE INDEX idx_cost_centers_tenant_id ON cost_centers(tenant_id);
CREATE INDEX idx_tenant_memberships_tenant_id ON tenant_memberships(tenant_id);
CREATE INDEX idx_tenant_memberships_user_id ON tenant_memberships(user_id);

-- Índices em foreign keys
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_tasks_contract_id ON tasks(contract_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_invoice_id ON tasks(invoice_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_documents_contract_id ON documents(contract_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_invoice_id ON documents(invoice_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_financial_categories_parent_id ON financial_categories(parent_id);

-- Índices para buscas
CREATE INDEX idx_clients_razao_social ON clients(tenant_id, razao_social);
CREATE INDEX idx_clients_cnpj ON clients(tenant_id, cnpj);
CREATE INDEX idx_clients_email ON clients(tenant_id, email);
CREATE INDEX idx_contracts_numero ON contracts(tenant_id, numero);
CREATE INDEX idx_invoices_competencia ON invoices(tenant_id, competencia);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_data_vencimento ON invoices(tenant_id, data_vencimento);
CREATE INDEX idx_tasks_status ON tasks(tenant_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(tenant_id, due_date);
CREATE INDEX idx_documents_type ON documents(tenant_id, type);
CREATE INDEX idx_documents_validade ON documents(tenant_id, validade);

-- Índices compostos úteis
CREATE INDEX idx_contracts_status_dates ON contracts(tenant_id, status, data_fim);
CREATE INDEX idx_invoices_status_vencimento ON invoices(tenant_id, status, data_vencimento);
