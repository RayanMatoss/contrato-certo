-- ============================================
-- Migration 009: Garantir INSERT em tenants (pós-deploy)
-- Corrige erro "new row violates row-level security policy for table tenants"
-- ao criar primeira empresa no ambiente de produção.
-- ============================================
-- No Supabase, use TO authenticated (não só WITH CHECK) para políticas de INSERT.
-- Ref: https://supabase.com/docs/guides/auth/row-level-security

-- Recriar política de INSERT para tenants
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;

CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can create tenants" ON tenants IS
  'Permite usuários autenticados criarem novo tenant (empresa). Necessário para criação da primeira empresa.';
