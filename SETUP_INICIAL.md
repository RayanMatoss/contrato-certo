# Setup Inicial do Supabase - Guia Rápido

## ✅ Passo a Passo

### 1. Aplicar Migrations (se ainda não aplicou)

No **SQL Editor** do Supabase Dashboard, execute na ordem:

1. ✅ `001_initial_schema.sql`
2. ✅ `002_rls_policies.sql`
3. ✅ `003_functions_triggers.sql`
4. ✅ `004_storage_setup.sql`

### 2. Criar Dados de Teste

Execute o arquivo **`005_seed_data.sql`** no SQL Editor do Supabase.

Este script cria:
- ✅ Um tenant de teste
- ✅ Vincula seu usuário (UUID: e2dc890d-9901-400f-b207-5730073bc494) ao tenant
- ✅ Cria 3 clientes de teste

### 3. Verificar se Funcionou

Execute no SQL Editor para verificar:

```sql
-- Verificar tenant
SELECT * FROM tenants;

-- Verificar seu usuário
SELECT * FROM users WHERE id = 'e2dc890d-9901-400f-b207-5730073bc494';

-- Verificar membership
SELECT * FROM tenant_memberships WHERE user_id = 'e2dc890d-9901-400f-b207-5730073bc494';

-- Verificar clientes
SELECT * FROM clients;
```

### 4. Testar na Aplicação

1. Reinicie o servidor: `npm run dev`
2. Acesse a página de **Contratos**
3. Clique em **"Novo Contrato"**
4. Você deve ver os 3 clientes no dropdown! 🎉

## 🔧 Troubleshooting

### Se não aparecer clientes no dropdown:
- Verifique se o script `005_seed_data.sql` foi executado
- Verifique se o tenant_id está correto
- Verifique o console do navegador para erros

### Se der erro de autenticação:
- Certifique-se de estar logado no Supabase Auth
- Verifique se o user_id está correto na tabela `users`
