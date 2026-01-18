# 🔧 Instruções para Corrigir o Erro 500

## Problema Identificado

O erro 500 está acontecendo porque a política RLS (Row Level Security) da tabela `tenant_memberships` está causando uma **dependência circular**.

Quando o sistema tenta buscar o `tenant_id` do usuário, a política verifica se o `tenant_id` está na lista de tenants do usuário, mas para fazer isso, ela precisa primeiro buscar o membership, criando um loop infinito.

## ✅ Solução

Execute o script de correção no SQL Editor do Supabase:

### Passo 1: Executar o Script de Correção

1. Abra o **SQL Editor** no Supabase Dashboard
2. Abra o arquivo `supabase/migrations/006_fix_tenant_memberships_rls.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**

### Passo 2: Verificar se Funcionou

Execute esta query para testar:

```sql
-- Esta query deve funcionar agora (substitua pelo seu user_id)
SELECT * FROM tenant_memberships WHERE user_id = 'e2dc890d-9901-400f-b207-5730073bc494';
```

Se retornar o registro sem erro, está funcionando!

### Passo 3: Recarregar a Aplicação

1. Feche e abra o navegador
2. Faça login novamente
3. Tente criar um contrato

## O que o Script Faz

O script:
1. Remove a política RLS problemática
2. Cria uma nova política que permite ao usuário ver diretamente seu próprio membership usando `user_id = auth.uid()`

Isso resolve a dependência circular e permite que o sistema busque o `tenant_id` corretamente.

## Verificação Final

Após executar o script, abra o console do navegador (F12) e você deve ver:

```
✅ Tenant ID encontrado: 00000000-0000-0000-0000-000000000001
```

Se ainda aparecer erro, verifique:
- Se o script foi executado com sucesso
- Se não há erros no SQL Editor
- Se você está autenticado corretamente
