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

## ✅ Solução (aplicar no Supabase de produção)

Execute as migrations no **mesmo projeto Supabase** que a aplicação em produção (Vercel) usa.

### Passo a passo

1. **Acesse o Dashboard do Supabase**
   - Vá para https://supabase.com/dashboard
   - Selecione o **projeto usado em produção** (o mesmo das variáveis `NEXT_PUBLIC_SUPABASE_*` na Vercel)

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**

3. **Execute as migrations nesta ordem**
   - **Primeiro:** copie todo o conteúdo de `supabase/migrations/009_fix_tenants_insert_rls.sql` → cole no SQL Editor → **Run**.  
     Isso garante que usuários autenticados possam inserir em `tenants` (criar empresa).
   - **Depois:** copie todo o conteúdo de `supabase/migrations/007_fix_tenant_creation_rls.sql` → cole no SQL Editor → **Run**.  
     Isso permite criar o membership próprio e ajusta o SELECT em `tenants`.

4. **Teste**
   - Tente criar uma nova empresa novamente na aplicação publicada.
   - O erro não deve mais aparecer.

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

- **009** – Garante a política de INSERT na tabela `tenants` (resolve o 403 ao criar empresa, comum após deploy).
- **007** – Permite criar o próprio membership e ajusta SELECT em `tenants` (criação da primeira empresa).

Devem estar aplicadas antes: `001`, `002`, `003`, `004`, e opcionalmente `005`, `006`.

## ⚠️ Nota

As migrations 007 e 009 podem ser aplicadas a qualquer momento no projeto Supabase de produção. Elas apenas recriam/ajustam políticas RLS para permitir a criação do primeiro tenant (empresa).
