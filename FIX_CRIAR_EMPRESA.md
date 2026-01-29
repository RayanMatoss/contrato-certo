# Correção: Erro ao Criar Nova Empresa

## 🔴 Problema

Ao tentar criar uma nova empresa, você recebe o erro:

```
new row violates row-level security policy for table "tenants"
```

E no console do navegador aparece:

```
POST https://...supabase.co/rest/v1/tenants?select=* 403 (Forbidden)
```

## 🔍 Causa

Podem ocorrer dois tipos de violação de RLS:

1. **Tabela `tenants`** – Em produção, a política de INSERT pode não estar ativa (migrations não aplicadas ou projeto Supabase diferente). O erro aparece como: *"new row violates row-level security policy for table **tenants**"*.
2. **Tabela `tenant_memberships`** – A política de INSERT exige que o usuário já seja admin de um tenant. Isso gera um “ovo e galinha”: para criar o primeiro tenant é preciso criar o membership, mas para criar membership era preciso ser admin de um tenant já existente.

## ✅ Solução definitiva (migration 010)

A aplicação **não insere mais direto na tabela `tenants`**. Ela chama a função **`create_tenant`** no banco, que cria o tenant e o membership em uma única operação com privilégios elevados (bypassa RLS). Assim o erro de RLS deixa de ocorrer.

### O que fazer no Supabase de produção (uma vez)

1. **Acesse o Dashboard do Supabase**
   - https://supabase.com/dashboard → selecione o **projeto usado em produção** (o mesmo das variáveis na Vercel).

2. **SQL Editor**
   - No menu lateral: **SQL Editor**.

3. **Rodar a migration 010**
   - Copie **todo** o conteúdo de `supabase/migrations/010_create_tenant_function.sql`.
   - Cole no SQL Editor e clique em **Run**.

4. **Testar**
   - Na aplicação publicada, tente criar uma nova empresa. O fluxo deve funcionar sem erro de RLS.

### Se ainda aparecer erro

Se o 403 continuar, execute também (no mesmo projeto):

- `supabase/migrations/009_fix_tenants_insert_rls.sql` (política INSERT em `tenants`).
- `supabase/migrations/007_fix_tenant_creation_rls.sql` (membership e SELECT em `tenants`).

## 📝 Conteúdo da Migration

A migration faz duas correções:

### 1. Política para criar membership próprio

```sql
CREATE POLICY "Users can create their own membership"
  ON tenant_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND auth.role() = 'authenticated'
  );
```

Esta política permite que usuários autenticados criem um membership quando o `user_id` do membership sendo criado é o próprio usuário autenticado.

### 2. Ajuste na política de SELECT para tenants

A migration também ajusta a política de SELECT para permitir que usuários vejam tenants onde são membros OU se são usuários autenticados que ainda não têm nenhum tenant (durante a primeira criação). Isso resolve o problema do `.select()` após o `.insert()` quando criando o primeiro tenant.

## 🔒 Segurança

A política é segura porque:
- Apenas permite criar membership para o próprio usuário (`user_id = auth.uid()`)
- Requer que o usuário esteja autenticado (`auth.role() = 'authenticated'`)
- Não permite criar memberships para outros usuários (isso ainda requer ser admin)

## 📚 Migrations Relacionadas

- **010 (solução definitiva)** – Cria a função `create_tenant`. A app chama essa RPC em vez de inserir em `tenants`; a função roda com `SECURITY DEFINER` e não depende de RLS.
- **009** – Política INSERT em `tenants` (fallback se não usar a RPC).
- **007** – Membership próprio e SELECT em `tenants`.

Devem estar aplicadas antes: `001`, `002`, `003`, `004`, e opcionalmente `005`, `006`.

## ⚠️ Nota

Depois de aplicar a **010** no Supabase de produção, a criação de empresa passa a usar a função `create_tenant` e deixa de depender das políticas RLS para INSERT em `tenants` e `tenant_memberships`.
