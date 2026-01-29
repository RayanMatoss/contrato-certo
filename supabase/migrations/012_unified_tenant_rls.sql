-- ============================================
-- Migration 012: Visão unificada – dados de todas as empresas do usuário
-- RLS permite ver/editar contratos, notas, tarefas, documentos etc. de
-- QUALQUER tenant em que o usuário é membro (não só o "primeiro").
-- ============================================

-- Helper: usuário pode acessar linha se o tenant_id é um dos seus
-- (substitui get_user_tenant_id() que retornava só o primeiro)

-- ========== CONTRACTS ==========
DROP POLICY IF EXISTS "Users can view contracts in their tenant" ON contracts;
CREATE POLICY "Users can view contracts in their tenants"
  ON contracts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert contracts in their tenant" ON contracts;
CREATE POLICY "Users can insert contracts in their tenants"
  ON contracts FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update contracts in their tenant" ON contracts;
CREATE POLICY "Users can update contracts in their tenants"
  ON contracts FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete contracts" ON contracts;
CREATE POLICY "Admins can delete contracts"
  ON contracts FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ========== INVOICES ==========
DROP POLICY IF EXISTS "Users can view invoices in their tenant" ON invoices;
CREATE POLICY "Users can view invoices in their tenants"
  ON invoices FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert invoices in their tenant" ON invoices;
CREATE POLICY "Users can insert invoices in their tenants"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update invoices in their tenant" ON invoices;
CREATE POLICY "Users can update invoices in their tenants"
  ON invoices FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;
CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ========== TASKS ==========
DROP POLICY IF EXISTS "Users can view tasks in their tenant" ON tasks;
CREATE POLICY "Users can view tasks in their tenants"
  ON tasks FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert tasks in their tenant" ON tasks;
CREATE POLICY "Users can insert tasks in their tenants"
  ON tasks FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update tasks in their tenant" ON tasks;
CREATE POLICY "Users can update tasks in their tenants"
  ON tasks FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete tasks in their tenant" ON tasks;
CREATE POLICY "Users can delete tasks in their tenants"
  ON tasks FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

-- ========== DOCUMENTS ==========
DROP POLICY IF EXISTS "Users can view documents in their tenant" ON documents;
CREATE POLICY "Users can view documents in their tenants"
  ON documents FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert documents in their tenant" ON documents;
CREATE POLICY "Users can insert documents in their tenants"
  ON documents FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update documents in their tenant" ON documents;
CREATE POLICY "Users can update documents in their tenants"
  ON documents FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete documents in their tenant" ON documents;
CREATE POLICY "Users can delete documents in their tenants"
  ON documents FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

-- ========== FINANCIAL_CATEGORIES ==========
DROP POLICY IF EXISTS "Users can view financial categories in their tenant" ON financial_categories;
CREATE POLICY "Users can view financial categories in their tenants"
  ON financial_categories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert financial categories in their tenant" ON financial_categories;
CREATE POLICY "Users can insert financial categories in their tenants"
  ON financial_categories FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update financial categories in their tenant" ON financial_categories;
CREATE POLICY "Users can update financial categories in their tenants"
  ON financial_categories FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete financial categories" ON financial_categories;
CREATE POLICY "Admins can delete financial categories"
  ON financial_categories FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ========== COST_CENTERS ==========
DROP POLICY IF EXISTS "Users can view cost centers in their tenant" ON cost_centers;
CREATE POLICY "Users can view cost centers in their tenants"
  ON cost_centers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert cost centers in their tenant" ON cost_centers;
CREATE POLICY "Users can insert cost centers in their tenants"
  ON cost_centers FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update cost centers in their tenant" ON cost_centers;
CREATE POLICY "Users can update cost centers in their tenants"
  ON cost_centers FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete cost centers" ON cost_centers;
CREATE POLICY "Admins can delete cost centers"
  ON cost_centers FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
