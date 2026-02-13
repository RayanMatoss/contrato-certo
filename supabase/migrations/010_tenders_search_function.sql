-- ============================================
-- Migration 010: Tenders Search Function
-- Função RPC para busca de licitações com full-text search
-- ============================================

CREATE OR REPLACE FUNCTION search_tenders(
  q TEXT DEFAULT NULL,
  p_uf TEXT DEFAULT NULL,
  p_municipio TEXT DEFAULT NULL,
  p_modalidade TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_min_val NUMERIC DEFAULT NULL,
  p_max_val NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  source_id TEXT,
  source_url TEXT,
  orgao TEXT,
  unidade TEXT,
  uf CHAR(2),
  municipio TEXT,
  modalidade TEXT,
  numero TEXT,
  ano INT,
  objeto TEXT,
  status TEXT,
  data_publicacao DATE,
  data_abertura TIMESTAMPTZ,
  valor_estimado NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
DECLARE
  search_query TSQUERY;
BEGIN
  -- Construir query de busca full-text se q fornecido
  IF q IS NOT NULL AND trim(q) != '' THEN
    search_query := websearch_to_tsquery('portuguese', q);
  ELSE
    search_query := NULL;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.source,
    t.source_id,
    t.source_url,
    t.orgao,
    t.unidade,
    t.uf,
    t.municipio,
    t.modalidade,
    t.numero,
    t.ano,
    t.objeto,
    t.status,
    t.data_publicacao,
    t.data_abertura,
    t.valor_estimado,
    t.created_at,
    t.updated_at,
    CASE 
      WHEN search_query IS NOT NULL THEN ts_rank(t.tender_search, search_query)
      ELSE 0::REAL
    END AS rank
  FROM tenders t
  WHERE 
    -- Busca full-text
    (search_query IS NULL OR t.tender_search @@ search_query)
    -- Filtros
    AND (p_uf IS NULL OR t.uf = p_uf)
    AND (p_municipio IS NULL OR t.municipio ILIKE '%' || p_municipio || '%')
    AND (p_modalidade IS NULL OR t.modalidade ILIKE '%' || p_modalidade || '%')
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_date_from IS NULL OR t.data_publicacao >= p_date_from)
    AND (p_date_to IS NULL OR t.data_publicacao <= p_date_to)
    AND (p_min_val IS NULL OR t.valor_estimado >= p_min_val)
    AND (p_max_val IS NULL OR t.valor_estimado <= p_max_val)
  ORDER BY
    CASE 
      WHEN search_query IS NOT NULL THEN ts_rank(t.tender_search, search_query)
      ELSE 0::REAL
    END DESC,
    t.data_publicacao DESC NULLS LAST,
    t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função auxiliar para contar total de resultados (sem paginação)
CREATE OR REPLACE FUNCTION count_tenders(
  q TEXT DEFAULT NULL,
  p_uf TEXT DEFAULT NULL,
  p_municipio TEXT DEFAULT NULL,
  p_modalidade TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_min_val NUMERIC DEFAULT NULL,
  p_max_val NUMERIC DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  search_query TSQUERY;
  result_count INT;
BEGIN
  IF q IS NOT NULL AND trim(q) != '' THEN
    search_query := websearch_to_tsquery('portuguese', q);
  ELSE
    search_query := NULL;
  END IF;

  SELECT COUNT(*) INTO result_count
  FROM tenders t
  WHERE 
    (search_query IS NULL OR t.tender_search @@ search_query)
    AND (p_uf IS NULL OR t.uf = p_uf)
    AND (p_municipio IS NULL OR t.municipio ILIKE '%' || p_municipio || '%')
    AND (p_modalidade IS NULL OR t.modalidade ILIKE '%' || p_modalidade || '%')
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_date_from IS NULL OR t.data_publicacao >= p_date_from)
    AND (p_date_to IS NULL OR t.data_publicacao <= p_date_to)
    AND (p_min_val IS NULL OR t.valor_estimado >= p_min_val)
    AND (p_max_val IS NULL OR t.valor_estimado <= p_max_val);

  RETURN result_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_tenders IS 'Busca licitações com full-text search e filtros';
COMMENT ON FUNCTION count_tenders IS 'Conta total de resultados da busca (sem paginação)';
