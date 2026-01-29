-- ============================================
-- Migration 007: Fix Tenant Creation RLS
-- Permite que usuários autenticados criem seu primeiro tenant
-- ============================================

-- Adicionar política que permite usuários autenticados criarem seu próprio membership
-- Isso é necessário para permitir a criação do primeiro tenant de um usuário
-- A política existente "Admins can add members" só funciona se o usuário já for admin de um tenant
-- Usa DROP IF EXISTS para permitir reexecutar a migration sem erro
DROP POLICY IF EXISTS "Users can create their own membership" ON tenant_memberships;

CREATE POLICY "Users can create their own membership"
  ON tenant_memberships FOR INSERT
  WITH CHECK (
    -- Permite criar membership se o user_id é o próprio usuário autenticado
    -- Isso permite criar o primeiro tenant
    user_id = auth.uid() AND auth.role() = 'authenticated'
  );

-- Ajustar política de SELECT para tenants
-- Permite que usuários vejam tenants onde são membros
-- E também permite ver durante a criação (quando ainda não há membership)
-- Isso resolve o problema do SELECT após INSERT quando criando o primeiro tenant
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;

CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    -- Pode ver se é membro do tenant
    id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    )
    OR
    -- OU se é um usuário autenticado sem nenhum tenant ainda (primeira criação)
    -- Isso permite ver o tenant recém-criado antes do membership ser criado
    (
      auth.role() = 'authenticated' 
      AND NOT EXISTS (
        SELECT 1 FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );
