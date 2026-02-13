-- ============================================
-- Migration 009: Tenders (Licitações) Schema
-- Schema completo para busca e ingestão de licitações
-- ============================================

-- Tabela principal de licitações
CREATE TABLE IF NOT EXISTS tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT,
  orgao TEXT,
  unidade TEXT,
  uf CHAR(2),
  municipio TEXT,
  modalidade TEXT,
  numero TEXT,
  ano INT,
  objeto TEXT NOT NULL,
  status TEXT,
  data_publicacao DATE,
  data_abertura TIMESTAMPTZ,
  valor_estimado NUMERIC(14,2),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenders_source_source_id_unique UNIQUE (source, source_id)
);

-- Ítens da licitação
CREATE TABLE IF NOT EXISTS tender_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  item_num INT,
  descricao TEXT NOT NULL,
  unidade TEXT,
  quantidade NUMERIC(14,3),
  valor_unitario NUMERIC(14,2),
  valor_total NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documentos da licitação
CREATE TABLE IF NOT EXISTS tender_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  doc_type TEXT,
  title TEXT,
  url TEXT NOT NULL,
  file_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atualizações/eventos da licitação
CREATE TABLE IF NOT EXISTS tender_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Estado de ingestão por fonte
CREATE TABLE IF NOT EXISTS ingestion_state (
  source TEXT PRIMARY KEY,
  cursor TEXT,
  last_run TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coluna gerada para busca full-text (usando trigger para compatibilidade)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_search TSVECTOR;

-- Função para atualizar tender_search
CREATE OR REPLACE FUNCTION update_tender_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tender_search := to_tsvector('portuguese',
    coalesce(NEW.objeto, '') || ' ' ||
    coalesce(NEW.orgao, '') || ' ' ||
    coalesce(NEW.municipio, '') || ' ' ||
    coalesce(NEW.modalidade, '') || ' ' ||
    coalesce(NEW.numero, '')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar tender_search e updated_at
DROP TRIGGER IF EXISTS trigger_update_tender_search ON tenders;
CREATE TRIGGER trigger_update_tender_search
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_search();

-- Trigger para updated_at em tenders
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenders_updated_at ON tenders;
CREATE TRIGGER trigger_update_tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para busca full-text
CREATE INDEX IF NOT EXISTS idx_tenders_search_gin ON tenders USING GIN (tender_search);

-- Índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_tenders_uf ON tenders(uf);
CREATE INDEX IF NOT EXISTS idx_tenders_municipio ON tenders(municipio);
CREATE INDEX IF NOT EXISTS idx_tenders_modalidade ON tenders(modalidade);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_data_publicacao_desc ON tenders(data_publicacao DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tenders_data_abertura_desc ON tenders(data_abertura DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tenders_source_source_id ON tenders(source, source_id);

-- Índices para relacionamentos
CREATE INDEX IF NOT EXISTS idx_tender_items_tender_id ON tender_items(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_docs_tender_id ON tender_docs(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_updates_tender_id ON tender_updates(tender_id);

-- Comentários
COMMENT ON TABLE tenders IS 'Tabela principal de licitações';
COMMENT ON COLUMN tenders.source IS 'Fonte dos dados (pncp, portal_x, diario_y, manual)';
COMMENT ON COLUMN tenders.source_id IS 'ID único na fonte original';
COMMENT ON COLUMN tenders.tender_search IS 'Campo gerado para busca full-text em português';
COMMENT ON TABLE tender_items IS 'Itens detalhados da licitação';
COMMENT ON TABLE tender_docs IS 'Documentos relacionados à licitação';
COMMENT ON TABLE tender_updates IS 'Histórico de atualizações/eventos da licitação';
COMMENT ON TABLE ingestion_state IS 'Estado de sincronização por fonte de dados';
