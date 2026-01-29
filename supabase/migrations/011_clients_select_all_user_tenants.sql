-- ============================================
-- Migration 011: Contratantes visíveis em todas as empresas do usuário
-- Permite ver/ usar contratantes de qualquer empresa em que o usuário é membro.
-- ============================================

-- Trocar política de SELECT em clients: ver clientes de QUALQUER tenant do usuário
-- (antes: só do "primeiro" tenant via get_user_tenant_id())
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON clients;

CREATE POLICY "Users can view clients in their tenants"
  ON clients FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view clients in their tenants" ON clients IS
  'Usuário pode ver contratantes de todas as empresas em que é membro (para usar em qualquer contrato).';

-- INSERT/UPDATE: permitir criar/editar clientes em qualquer tenant do usuário
DROP POLICY IF EXISTS "Users can insert clients in their tenant" ON clients;
CREATE POLICY "Users can insert clients in their tenants"
  ON clients FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update clients in their tenant" ON clients;
CREATE POLICY "Users can update clients in their tenants"
  ON clients FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
  );

-- DELETE: manter lógica de admin, mas em qualquer tenant do usuário
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
