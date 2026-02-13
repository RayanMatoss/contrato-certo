-- ============================================
-- Migration 011: Tenders Seed Data (Dev)
-- Dados de teste para desenvolvimento
-- ============================================

-- Inserir 5 licitações de exemplo com variações para testar busca e filtros

-- Licitação 1: Pregão Eletrônico em São Paulo
INSERT INTO tenders (
  source, source_id, source_url, orgao, unidade, uf, municipio,
  modalidade, numero, ano, objeto, status, data_publicacao, data_abertura, valor_estimado
) VALUES (
  'manual', 'seed-001', 'https://example.com/tender/001',
  'Prefeitura Municipal de São Paulo', 'Secretaria de Tecnologia da Informação',
  'SP', 'São Paulo',
  'Pregão Eletrônico', '001/2024', 2024,
  'Aquisição de equipamentos de informática e licenças de software para modernização da infraestrutura tecnológica',
  'Aberta', '2024-01-15', '2024-02-15 14:00:00', 500000.00
) ON CONFLICT (source, source_id) DO NOTHING
RETURNING id;

-- Licitação 2: Concorrência no Rio de Janeiro
INSERT INTO tenders (
  source, source_id, source_url, orgao, unidade, uf, municipio,
  modalidade, numero, ano, objeto, status, data_publicacao, data_abertura, valor_estimado
) VALUES (
  'manual', 'seed-002', 'https://example.com/tender/002',
  'Governo do Estado do Rio de Janeiro', 'Secretaria de Obras',
  'RJ', 'Rio de Janeiro',
  'Concorrência', '045/2024', 2024,
  'Execução de obras de pavimentação asfáltica em vias públicas do município',
  'Encerrada', '2024-01-20', '2024-02-20 10:00:00', 2500000.00
) ON CONFLICT (source, source_id) DO NOTHING
RETURNING id;

-- Licitação 3: Pregão Presencial em Belo Horizonte
INSERT INTO tenders (
  source, source_id, source_url, orgao, unidade, uf, municipio,
  modalidade, numero, ano, objeto, status, data_publicacao, data_abertura, valor_estimado
) VALUES (
  'manual', 'seed-003', 'https://example.com/tender/003',
  'Prefeitura Municipal de Belo Horizonte', 'Secretaria de Educação',
  'MG', 'Belo Horizonte',
  'Pregão Presencial', '123/2024', 2024,
  'Contratação de serviços de merenda escolar para unidades de ensino da rede municipal',
  'Homologada', '2024-01-10', '2024-01-25 09:00:00', 1200000.00
) ON CONFLICT (source, source_id) DO NOTHING
RETURNING id;

-- Licitação 4: Tomada de Preços em Brasília
INSERT INTO tenders (
  source, source_id, source_url, orgao, unidade, uf, municipio,
  modalidade, numero, ano, objeto, status, data_publicacao, data_abertura, valor_estimado
) VALUES (
  'manual', 'seed-004', 'https://example.com/tender/004',
  'Ministério da Saúde', 'Departamento de Logística',
  'DF', 'Brasília',
  'Tomada de Preços', 'TP-078/2024', 2024,
  'Aquisição de medicamentos e materiais hospitalares para unidades de saúde',
  'Aberta', '2024-02-01', '2024-02-28 15:30:00', 3500000.00
) ON CONFLICT (source, source_id) DO NOTHING
RETURNING id;

-- Licitação 5: Dispensa em Curitiba
INSERT INTO tenders (
  source, source_id, source_url, orgao, unidade, uf, municipio,
  modalidade, numero, ano, objeto, status, data_publicacao, data_abertura, valor_estimado
) VALUES (
  'manual', 'seed-005', 'https://example.com/tender/005',
  'Prefeitura Municipal de Curitiba', 'Secretaria de Meio Ambiente',
  'PR', 'Curitiba',
  'Dispensa', 'DISP-012/2024', 2024,
  'Contratação de serviços de manutenção de áreas verdes e parques municipais',
  'Cancelada', '2024-01-05', NULL, 150000.00
) ON CONFLICT (source, source_id) DO NOTHING
RETURNING id;

-- Inserir itens para algumas licitações
-- Itens para Licitação 1
INSERT INTO tender_items (tender_id, item_num, descricao, unidade, quantidade, valor_unitario, valor_total)
SELECT 
  t.id, 1, 'Notebook Dell Latitude 5520', 'UN', 50, 3500.00, 175000.00
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_items (tender_id, item_num, descricao, unidade, quantidade, valor_unitario, valor_total)
SELECT 
  t.id, 2, 'Licença Microsoft Office 365', 'UN', 100, 150.00, 15000.00
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_items (tender_id, item_num, descricao, unidade, quantidade, valor_unitario, valor_total)
SELECT 
  t.id, 3, 'Servidor Dell PowerEdge R740', 'UN', 5, 25000.00, 125000.00
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

-- Itens para Licitação 3
INSERT INTO tender_items (tender_id, item_num, descricao, unidade, quantidade, valor_unitario, valor_total)
SELECT 
  t.id, 1, 'Refeição completa (almoço)', 'UN', 50000, 8.50, 425000.00
FROM tenders t WHERE t.source_id = 'seed-003'
ON CONFLICT DO NOTHING;

INSERT INTO tender_items (tender_id, item_num, descricao, unidade, quantidade, valor_unitario, valor_total)
SELECT 
  t.id, 2, 'Lanche escolar', 'UN', 50000, 3.00, 150000.00
FROM tenders t WHERE t.source_id = 'seed-003'
ON CONFLICT DO NOTHING;

-- Inserir documentos para algumas licitações
INSERT INTO tender_docs (tender_id, doc_type, title, url)
SELECT 
  t.id, 'Edital', 'Edital de Licitação', 'https://example.com/docs/edital-001.pdf'
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_docs (tender_id, doc_type, title, url)
SELECT 
  t.id, 'Anexo', 'Anexo I - Especificações Técnicas', 'https://example.com/docs/anexo-001.pdf'
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_docs (tender_id, doc_type, title, url)
SELECT 
  t.id, 'Edital', 'Edital de Licitação', 'https://example.com/docs/edital-003.pdf'
FROM tenders t WHERE t.source_id = 'seed-003'
ON CONFLICT DO NOTHING;

-- Inserir atualizações/eventos
INSERT INTO tender_updates (tender_id, event_type, event_date, payload)
SELECT 
  t.id, 'Publicação', '2024-01-15 08:00:00', '{"tipo": "publicacao", "observacao": "Edital publicado no Diário Oficial"}'
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_updates (tender_id, event_type, event_date, payload)
SELECT 
  t.id, 'Prorrogação', '2024-01-25 10:00:00', '{"tipo": "prorrogacao", "nova_data": "2024-02-15"}'
FROM tenders t WHERE t.source_id = 'seed-001'
ON CONFLICT DO NOTHING;

INSERT INTO tender_updates (tender_id, event_type, event_date, payload)
SELECT 
  t.id, 'Homologação', '2024-01-30 14:00:00', '{"tipo": "homologacao", "vencedor": "Empresa XYZ Ltda"}'
FROM tenders t WHERE t.source_id = 'seed-003'
ON CONFLICT DO NOTHING;

-- Comentário final
COMMENT ON TABLE tenders IS 'Seed data inserido para desenvolvimento e testes';
