-- ============================================
-- Script SQL para criar o bucket 'documents'
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Criar bucket 'documents' (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Bucket privado
  10485760, -- 10MB em bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT * FROM storage.buckets WHERE id = 'documents';
