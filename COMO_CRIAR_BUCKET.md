# 🚀 Como Criar o Bucket de Storage

## Método Mais Rápido: Via SQL Editor

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**

3. **Execute este SQL**:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('documents', 'documents', false)
   ON CONFLICT (id) DO NOTHING;
   ```

4. **Pronto!** ✅
   - O bucket foi criado
   - As policies RLS já estão configuradas pela migration 004

## Método Alternativo: Via Dashboard

1. **Storage > New Bucket**
2. **Nome**: `documents`
3. **Public**: **Desmarcado** (privado)
4. **Create**

## Verificar se Funcionou

Após criar, teste fazendo upload de um documento na aplicação.

Se ainda der erro, verifique se a migration `004_storage_setup.sql` foi executada.
