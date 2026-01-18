# ⚡ Solução Rápida - Erro 500 ao Buscar Tenant ID

## O Problema

A política RLS está causando uma dependência circular. Quando o sistema tenta buscar o `tenant_id`, precisa verificar a política, mas a política precisa do `tenant_id` para funcionar.

## ✅ Solução em 3 Passos

### 1. Execute APENAS este script no SQL Editor:

```sql
-- Remover a política problemática
DROP POLICY IF EXISTS "Users can view memberships in their tenant" ON tenant_memberships;

-- Criar política corrigida
CREATE POLICY "Users can view their own membership"
  ON tenant_memberships FOR SELECT
  USING (user_id = auth.uid());
```

### 2. Verifique se funcionou:

```sql
SELECT * FROM tenant_memberships WHERE user_id = 'e2dc890d-9901-400f-b207-5730073bc494';
```

Deve retornar o registro sem erro.

### 3. Recarregue a aplicação:

1. Feche e abra o navegador
2. Faça login
3. Tente criar um contrato

## ✅ Pronto!

O erro 500 deve estar resolvido. O sistema agora consegue buscar o `tenant_id` corretamente.
