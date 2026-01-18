-- ============================================
-- Migration 004: Storage Setup
-- Configuração de buckets para armazenamento de arquivos
-- ============================================

-- ============================================
-- Criar bucket para documentos
-- ============================================

-- Nota: Buckets são criados via API do Supabase ou Dashboard
-- Este arquivo contém as policies RLS para o storage

-- ============================================
-- Policies RLS para Storage Bucket 'documents'
-- ============================================

-- SELECT: Usuários podem ver documentos do seu tenant
CREATE POLICY "Users can view documents in their tenant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM tenants
      WHERE id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Usuários podem fazer upload de documentos no seu tenant
CREATE POLICY "Users can upload documents in their tenant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM tenants
      WHERE id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: Usuários podem atualizar documentos do seu tenant
CREATE POLICY "Users can update documents in their tenant"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM tenants
      WHERE id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM tenants
      WHERE id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- DELETE: Usuários podem deletar documentos do seu tenant
CREATE POLICY "Users can delete documents in their tenant"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM tenants
      WHERE id IN (
        SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      )
    )
  );
