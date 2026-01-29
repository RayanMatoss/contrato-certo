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

## ✅ Solução definitiva (API route no servidor)

A aplicação **não insere mais direto na tabela `tenants`**. Ao criar empresa, o frontend chama **`POST /api/tenants/create`**. Essa API usa a **service role** do Supabase no servidor (Vercel), que **bypassa RLS**. Assim o erro de RLS deixa de ocorrer, sem precisar rodar SQL manual no Supabase.

### O que fazer na Vercel (uma vez)

1. **Adicione a variável de ambiente**
   - Vercel → seu projeto → **Settings** → **Environment Variables**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** a chave **service_role** do Supabase (Dashboard do Supabase → **Settings** → **API** → **Project API keys** → **service_role** — copie e cole; **nunca** exponha no frontend)
   - Marque **Production** (e Preview/Development se quiser)

2. **Redeploy**
   - **Deployments** → menu (...) do último deploy → **Redeploy**  
   - Ou faça um novo push no repositório.

3. **Testar**
   - Na aplicação publicada, tente criar uma nova empresa. O fluxo deve funcionar sem erro de RLS.

### Alternativa: função no banco (migration 010)

Se preferir não usar a service role na Vercel, pode usar a função `create_tenant` no Supabase: rode no **SQL Editor** do projeto o conteúdo de `supabase/migrations/010_create_tenant_function.sql` e altere o frontend para chamar a RPC `create_tenant` em vez da API (o código atual usa a API).

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
