# Guia para Resolver o Problema de Tenant ID

## Problema
O sistema não está conseguindo identificar o `tenant_id` do usuário, o que impede criar contratos.

## Passo a Passo para Resolver

### 1. Verificar se você está autenticado

1. Abra o console do navegador (F12 → Console)
2. Verifique se há erros de autenticação
3. Se não estiver logado, faça login novamente

### 2. Verificar seu User ID no Supabase

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** → **Users**
3. Encontre seu usuário e copie o **User ID** (UUID)

### 3. Verificar se o script foi executado

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute esta query para verificar se seu usuário tem um tenant:

```sql
-- Substitua 'SEU-USER-ID-AQUI' pelo seu User ID
SELECT * FROM tenant_memberships WHERE user_id = 'SEU-USER-ID-AQUI';
```

**Se retornar vazio**, você precisa executar o script `005_seed_data.sql`.

### 4. Executar o script de seed data

1. Abra o arquivo `supabase/migrations/005_seed_data.sql`
2. **IMPORTANTE**: Substitua o UUID na linha 28 pelo seu User ID real
3. No SQL Editor do Supabase, cole todo o conteúdo do script
4. Clique em **Run** para executar

### 5. Verificar se funcionou

Execute esta query para confirmar:

```sql
-- Verificar tenant criado
SELECT * FROM tenants;

-- Verificar seu usuário
SELECT * FROM users WHERE id = 'SEU-USER-ID-AQUI';

-- Verificar membership
SELECT * FROM tenant_memberships WHERE user_id = 'SEU-USER-ID-AQUI';

-- Verificar clientes
SELECT * FROM clients;
```

### 6. Recarregar a aplicação

1. Feche e abra novamente o navegador
2. Faça login novamente
3. Tente criar um contrato

## Alternativa: Criar manualmente

Se preferir criar manualmente, execute estas queries no SQL Editor:

```sql
-- 1. Criar tenant (substitua os valores)
INSERT INTO tenants (id, name, slug, cnpj, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Minha Empresa',
  'minha-empresa',
  '12.345.678/0001-90',
  NOW(),
  NOW()
)
RETURNING id;

-- 2. Copie o ID do tenant retornado acima e use aqui
-- 3. Criar registro do usuário (substitua 'SEU-USER-ID-AQUI')
INSERT INTO users (id, email, full_name, created_at)
VALUES (
  'SEU-USER-ID-AQUI',
  'seu@email.com',
  'Seu Nome',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

-- 4. Criar membership (substitua 'TENANT-ID' e 'SEU-USER-ID-AQUI')
INSERT INTO tenant_memberships (tenant_id, user_id, role, created_at)
VALUES (
  'TENANT-ID', -- ID do tenant criado no passo 1
  'SEU-USER-ID-AQUI',
  'admin',
  NOW()
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 5. Criar alguns clientes de teste (substitua 'TENANT-ID')
INSERT INTO clients (
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
    'TENANT-ID',
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
    'TENANT-ID',
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
  );
```

## Verificar no Console

Após fazer login, abra o console do navegador (F12) e verifique se aparece:

```
✅ Tenant ID encontrado: [um-uuid-aqui]
```

Se aparecer `⚠️ Tenant ID não encontrado`, significa que o script não foi executado ou o User ID está incorreto.
