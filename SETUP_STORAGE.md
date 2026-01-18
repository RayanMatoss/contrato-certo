# Configuração do Bucket de Storage - Supabase

## 🎯 Objetivo
Criar o bucket `documents` no Supabase Storage para armazenar documentos.

## 📋 Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Storage**
   - No menu lateral, clique em **Storage**

3. **Criar Novo Bucket**
   - Clique no botão **"New bucket"** ou **"Create bucket"**
   - Preencha os campos:
     - **Name**: `documents`
     - **Public bucket**: **Desmarcado** (deixe privado)
     - **File size limit**: `10485760` (10MB) - opcional
     - **Allowed MIME types**: Deixe vazio ou adicione:
       - `application/pdf`
       - `application/msword`
       - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
       - `application/vnd.ms-excel`
       - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
       - `image/jpeg`
       - `image/png`
   - Clique em **"Create bucket"**

4. **Verificar Policies RLS**
   - Certifique-se de que a migration `004_storage_setup.sql` foi executada
   - As policies RLS já devem estar configuradas automaticamente

## 📋 Opção 2: Via SQL (Criar bucket via função)

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Criar bucket 'documents' via função
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;
```

## 📋 Opção 3: Via API (Script Node.js)

1. **Adicione a Service Role Key no `.env.local`**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```
   > ⚠️ **Importante**: Use a **Service Role Key**, não a anon key!
   > Encontre ela em: Dashboard > Settings > API > service_role key

2. **Execute o script**:
   ```bash
   node scripts/setup-storage-bucket.js
   ```

## ✅ Verificar se Funcionou

Após criar o bucket, teste fazendo upload de um documento na aplicação.

Se ainda der erro, verifique:

1. ✅ O bucket `documents` foi criado
2. ✅ A migration `004_storage_setup.sql` foi executada
3. ✅ As policies RLS estão ativas (verifique em Storage > Policies)
4. ✅ O usuário está autenticado e tem acesso ao tenant

## 🔧 Troubleshooting

### Erro: "Bucket not found"
- Certifique-se de que o bucket foi criado com o nome exato `documents`
- Verifique se está no projeto correto do Supabase

### Erro: "new row violates row-level security policy"
- Execute a migration `004_storage_setup.sql` novamente
- Verifique se o usuário está autenticado
- Verifique se o usuário tem membership no tenant

### Erro: "The resource already exists"
- O bucket já existe, tudo certo! Pode prosseguir.
