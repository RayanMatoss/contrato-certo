-- ============================================
-- Migration 003: Functions and Triggers
-- Funções utilitárias e triggers automáticos
-- ============================================

-- ============================================
-- Função para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers para updated_at
-- ============================================

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Funções de Dashboard e Métricas
-- ============================================

-- Função para obter métricas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_tenant_id UUID)
RETURNS TABLE (
  contracts_expiring_soon INTEGER,
  invoices_to_issue INTEGER,
  overdue_invoices INTEGER,
  receivables_this_month NUMERIC,
  forecast_30_days NUMERIC,
  forecast_60_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Contratos expirando em 60 dias
    (SELECT COUNT(*)::INTEGER
     FROM contracts
     WHERE tenant_id = p_tenant_id
       AND status = 'ativo'
       AND data_fim BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')) AS contracts_expiring_soon,
    
    -- Notas fiscais a emitir
    (SELECT COUNT(*)::INTEGER
     FROM invoices
     WHERE tenant_id = p_tenant_id
       AND status = 'a_emitir') AS invoices_to_issue,
    
    -- Notas fiscais vencidas
    (SELECT COUNT(*)::INTEGER
     FROM invoices
     WHERE tenant_id = p_tenant_id
       AND status IN ('emitida', 'enviada', 'em_cobranca', 'parcial', 'vencida')
       AND data_vencimento < CURRENT_DATE) AS overdue_invoices,
    
    -- Recebíveis deste mês
    (SELECT COALESCE(SUM(valor_liquido), 0)
     FROM invoices
     WHERE tenant_id = p_tenant_id
       AND status IN ('emitida', 'enviada', 'em_cobranca', 'parcial', 'paga')
       AND DATE_TRUNC('month', data_vencimento) = DATE_TRUNC('month', CURRENT_DATE)) AS receivables_this_month,
    
    -- Previsão 30 dias
    (SELECT COALESCE(SUM(valor_liquido), 0)
     FROM invoices
     WHERE tenant_id = p_tenant_id
       AND status IN ('emitida', 'enviada', 'em_cobranca', 'parcial')
       AND data_vencimento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')) AS forecast_30_days,
    
    -- Previsão 60 dias
    (SELECT COALESCE(SUM(valor_liquido), 0)
     FROM invoices
     WHERE tenant_id = p_tenant_id
       AND status IN ('emitida', 'enviada', 'em_cobranca', 'parcial')
       AND data_vencimento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')) AS forecast_60_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter contratos próximos do vencimento
CREATE OR REPLACE FUNCTION get_contracts_expiring_soon(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  numero TEXT,
  client_id UUID,
  razao_social TEXT,
  data_fim DATE,
  dias_restantes INTEGER,
  valor_mensal NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.numero,
    c.client_id,
    cl.razao_social,
    c.data_fim,
    (c.data_fim - CURRENT_DATE)::INTEGER AS dias_restantes,
    c.valor_mensal
  FROM contracts c
  INNER JOIN clients cl ON cl.id = c.client_id
  WHERE c.tenant_id = p_tenant_id
    AND c.status = 'ativo'
    AND c.data_fim BETWEEN CURRENT_DATE AND (CURRENT_DATE + (p_days || ' days')::INTERVAL)
  ORDER BY c.data_fim ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notas fiscais vencidas
CREATE OR REPLACE FUNCTION get_overdue_invoices(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  numero_nf TEXT,
  competencia TEXT,
  client_id UUID,
  razao_social TEXT,
  data_vencimento DATE,
  dias_atraso INTEGER,
  valor_liquido NUMERIC,
  status invoice_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.numero_nf,
    i.competencia,
    i.client_id,
    cl.razao_social,
    i.data_vencimento,
    (CURRENT_DATE - i.data_vencimento)::INTEGER AS dias_atraso,
    i.valor_liquido,
    i.status
  FROM invoices i
  INNER JOIN clients cl ON cl.id = i.client_id
  WHERE i.tenant_id = p_tenant_id
    AND i.status IN ('emitida', 'enviada', 'em_cobranca', 'parcial', 'vencida')
    AND i.data_vencimento < CURRENT_DATE
  ORDER BY i.data_vencimento ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular totais de uma nota fiscal
CREATE OR REPLACE FUNCTION calculate_invoice_totals(p_invoice_id UUID)
RETURNS TABLE (
  valor_bruto NUMERIC,
  valor_impostos NUMERIC,
  valor_retencoes NUMERIC,
  valor_liquido NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.valor_bruto,
    COALESCE(i.valor_impostos, 0) AS valor_impostos,
    COALESCE(i.retencoes, 0) AS valor_retencoes,
    i.valor_liquido
  FROM invoices i
  WHERE i.id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função para atualizar status de notas fiscais vencidas
-- ============================================

CREATE OR REPLACE FUNCTION update_overdue_invoices_status()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'vencida'
  WHERE status IN ('emitida', 'enviada', 'em_cobranca', 'parcial')
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função para obter documentos expirando em breve
-- ============================================

CREATE OR REPLACE FUNCTION get_expiring_documents(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type document_type,
  validade DATE,
  dias_restantes INTEGER,
  contract_id UUID,
  client_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.type,
    d.validade,
    (d.validade - CURRENT_DATE)::INTEGER AS dias_restantes,
    d.contract_id,
    d.client_id
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.validade IS NOT NULL
    AND d.validade BETWEEN CURRENT_DATE AND (CURRENT_DATE + (p_days || ' days')::INTERVAL)
  ORDER BY d.validade ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função para obter tarefas pendentes do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_pending_tasks(
  p_tenant_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type task_type,
  due_date DATE,
  contract_id UUID,
  client_id UUID,
  invoice_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.type,
    t.due_date,
    t.contract_id,
    t.client_id,
    t.invoice_id,
    t.created_at
  FROM tasks t
  WHERE t.tenant_id = p_tenant_id
    AND (t.assigned_to = p_user_id OR t.created_by = p_user_id)
    AND t.status IN ('pendente', 'em_andamento')
  ORDER BY 
    CASE WHEN t.due_date IS NOT NULL THEN 0 ELSE 1 END,
    t.due_date ASC,
    t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
