-- ============================================
-- Migration 005: Seed Data (Dados de Teste)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- Criar Tenant de Teste
-- ============================================

INSERT INTO tenants (id, name, slug, cnpj, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Empresa Teste',
  'empresa-teste',
  '12.345.678/0001-90',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Criar Usuário na tabela users
-- ============================================

-- NOTA: O usuário já existe no auth.users, apenas criamos o registro na tabela users
INSERT INTO users (id, email, full_name, created_at)
VALUES (
  'e2dc890d-9901-400f-b207-5730073bc494',
  'usuario@teste.com', -- Ajuste o email se necessário
  'Usuário Teste',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

-- ============================================
-- Criar Tenant Membership
-- ============================================

INSERT INTO tenant_memberships (tenant_id, user_id, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'e2dc890d-9901-400f-b207-5730073bc494',
  'admin',
  NOW()
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- ============================================
-- Criar Clientes de Teste
-- ============================================

INSERT INTO clients (
  id,
  tenant_id,
  razao_social,
  nome_fantasia,
  cnpj,
  email,
  telefone,
  cidade,
  uf,
  status,
  created_at,
  updated_at
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Prefeitura Municipal de São Paulo',
    'Prefeitura SP',
    '46.395.000/0001-39',
    'contratos@prefeitura.sp.gov.br',
    '(11) 3113-8000',
    'São Paulo',
    'SP',
    'ativo',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Fundo Municipal de Saúde de Campinas',
    'FMS Campinas',
    '51.885.242/0001-40',
    'fms@campinas.sp.gov.br',
    '(19) 3772-5500',
    'Campinas',
    'SP',
    'ativo',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Secretaria de Educação de Ribeirão Preto',
    'Sec. Educação RP',
    '45.371.901/0001-43',
    'educacao@ribeirao.sp.gov.br',
    '(16) 3977-9300',
    'Ribeirão Preto',
    'SP',
    'ativo',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verificar se os dados foram criados
-- ============================================

-- Descomente as linhas abaixo para verificar:
-- SELECT * FROM tenants;
-- SELECT * FROM users WHERE id = 'e2dc890d-9901-400f-b207-5730073bc494';
-- SELECT * FROM tenant_memberships WHERE user_id = 'e2dc890d-9901-400f-b207-5730073bc494';
-- SELECT * FROM clients WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
