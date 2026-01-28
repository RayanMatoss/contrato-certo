-- ============================================
-- Migration 008: Add file_path to contracts
-- Adiciona campo para armazenar o arquivo do contrato
-- ============================================

-- Adicionar coluna file_path na tabela contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_mime_type TEXT;

-- Comentário explicativo
COMMENT ON COLUMN contracts.file_path IS 'Caminho do arquivo do contrato no storage';
COMMENT ON COLUMN contracts.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN contracts.file_mime_type IS 'Tipo MIME do arquivo';
