-- ============================================
-- Migration 006: Fix Tenant Memberships RLS
-- Corrige a política RLS que estava causando erro 500
-- ============================================

-- Remover a política problemática que causa dependência circular
-- Esta política tenta verificar o tenant_id antes de ter acesso ao registro
DROP POLICY IF EXISTS "Users can view memberships in their tenant" ON tenant_memberships;

-- Criar política corrigida que permite ao usuário ver seu próprio membership
-- Esta política é necessária para que o usuário possa buscar seu tenant_id inicialmente
-- Usa user_id = auth.uid() diretamente, sem dependência circular
CREATE POLICY "Users can view their own membership"
  ON tenant_memberships FOR SELECT
  USING (user_id = auth.uid());
