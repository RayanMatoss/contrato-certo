-- ============================================
-- Migration 009: Garantir INSERT em tenants (pós-deploy)
-- Corrige erro "new row violates row-level security policy for table tenants"
-- ao criar primeira empresa no ambiente de produção.
-- ============================================

-- Recriar política de INSERT para tenants
-- Permite que qualquer usuário autenticado crie um tenant (sua primeira empresa)
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;

CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can create tenants" ON tenants IS
  'Permite usuários autenticados criarem novo tenant (empresa). Necessário para criação da primeira empresa.';
