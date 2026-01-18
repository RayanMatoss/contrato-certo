-- ============================================
-- Migration 002: Row Level Security Policies
-- Configuração de RLS para multi-tenancy
-- ============================================

-- ============================================
-- Função Helper para RLS
-- ============================================

-- Função para obter o tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Buscar o primeiro tenant do usuário (pode ser expandido para múltiplos tenants)
  SELECT tenant_id INTO user_tenant_id
  FROM tenant_memberships
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Habilitar RLS em todas as tabelas
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies para Tenants
-- ============================================

-- SELECT: Usuários podem ver tenants onde são membros
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  );

-- INSERT: Apenas usuários autenticados podem criar tenants
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Apenas admins do tenant podem atualizar
CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Users
-- ============================================

-- SELECT: Usuários podem ver a si mesmos e outros usuários do mesmo tenant
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM tenant_memberships
      WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Sistema pode inserir usuários
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- UPDATE: Usuários podem atualizar a si mesmos
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- Policies para Tenant Memberships
-- ============================================

-- SELECT: Usuários podem ver memberships do seu tenant
CREATE POLICY "Users can view memberships in their tenant"
  ON tenant_memberships FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  );

-- INSERT: Apenas admins podem adicionar membros
CREATE POLICY "Admins can add members"
  ON tenant_memberships FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: Apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles"
  ON tenant_memberships FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Apenas admins podem remover membros
CREATE POLICY "Admins can remove members"
  ON tenant_memberships FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Clients
-- ============================================

-- SELECT: Usuários podem ver clientes do seu tenant
CREATE POLICY "Users can view clients in their tenant"
  ON clients FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar clientes no seu tenant
CREATE POLICY "Users can insert clients in their tenant"
  ON clients FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar clientes do seu tenant
CREATE POLICY "Users can update clients in their tenant"
  ON clients FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Apenas admins podem deletar clientes
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Contracts
-- ============================================

-- SELECT: Usuários podem ver contratos do seu tenant
CREATE POLICY "Users can view contracts in their tenant"
  ON contracts FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar contratos no seu tenant
CREATE POLICY "Users can insert contracts in their tenant"
  ON contracts FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar contratos do seu tenant
CREATE POLICY "Users can update contracts in their tenant"
  ON contracts FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Apenas admins podem deletar contratos
CREATE POLICY "Admins can delete contracts"
  ON contracts FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Invoices
-- ============================================

-- SELECT: Usuários podem ver notas fiscais do seu tenant
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar notas fiscais no seu tenant
CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar notas fiscais do seu tenant
CREATE POLICY "Users can update invoices in their tenant"
  ON invoices FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Apenas admins podem deletar notas fiscais
CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Tasks
-- ============================================

-- SELECT: Usuários podem ver tarefas do seu tenant
CREATE POLICY "Users can view tasks in their tenant"
  ON tasks FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar tarefas no seu tenant
CREATE POLICY "Users can insert tasks in their tenant"
  ON tasks FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar tarefas do seu tenant
CREATE POLICY "Users can update tasks in their tenant"
  ON tasks FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Usuários podem deletar tarefas do seu tenant
CREATE POLICY "Users can delete tasks in their tenant"
  ON tasks FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================
-- Policies para Documents
-- ============================================

-- SELECT: Usuários podem ver documentos do seu tenant
CREATE POLICY "Users can view documents in their tenant"
  ON documents FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar documentos no seu tenant
CREATE POLICY "Users can insert documents in their tenant"
  ON documents FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar documentos do seu tenant
CREATE POLICY "Users can update documents in their tenant"
  ON documents FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Usuários podem deletar documentos do seu tenant
CREATE POLICY "Users can delete documents in their tenant"
  ON documents FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================
-- Policies para Financial Categories
-- ============================================

-- SELECT: Usuários podem ver categorias do seu tenant
CREATE POLICY "Users can view financial categories in their tenant"
  ON financial_categories FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar categorias no seu tenant
CREATE POLICY "Users can insert financial categories in their tenant"
  ON financial_categories FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar categorias do seu tenant
CREATE POLICY "Users can update financial categories in their tenant"
  ON financial_categories FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Apenas admins podem deletar categorias
CREATE POLICY "Admins can delete financial categories"
  ON financial_categories FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Policies para Cost Centers
-- ============================================

-- SELECT: Usuários podem ver centros de custo do seu tenant
CREATE POLICY "Users can view cost centers in their tenant"
  ON cost_centers FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- INSERT: Usuários podem criar centros de custo no seu tenant
CREATE POLICY "Users can insert cost centers in their tenant"
  ON cost_centers FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- UPDATE: Usuários podem atualizar centros de custo do seu tenant
CREATE POLICY "Users can update cost centers in their tenant"
  ON cost_centers FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- DELETE: Apenas admins podem deletar centros de custo
CREATE POLICY "Admins can delete cost centers"
  ON cost_centers FOR DELETE
  USING (
    tenant_id = get_user_tenant_id() AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
