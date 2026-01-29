# Configuração de Variáveis de Ambiente na Vercel

## ⚠️ Erro Comum

Se você está vendo este erro durante o build na Vercel:

```
❌ Erro: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não encontrada ou inválida
```

Isso significa que as variáveis de ambiente não estão configuradas no projeto Vercel.

## 📝 Como Configurar

### 1. Acesse o Dashboard da Vercel

1. Vá para https://vercel.com/dashboard
2. Selecione seu projeto

### 2. Configure as Variáveis de Ambiente

1. Vá em **Settings** > **Environment Variables**
2. Adicione as seguintes variáveis:

#### Variável 1: NEXT_PUBLIC_SUPABASE_URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: A URL do seu projeto Supabase (ex: `https://egnziasbgdbqatpofveq.supabase.co`)
- **Environments**: Marque todas (Production, Preview, Development)

#### Variável 2: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- **Key**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Value**: A chave **anon public** do Supabase (NÃO a URL!)
- **Environments**: Marque todas (Production, Preview, Development)

#### Variável 3: SUPABASE_SERVICE_ROLE_KEY (obrigatória para criar empresa)
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: A chave **service_role** do Supabase (Dashboard Supabase → Settings → API → service_role)
- **Environments**: Marque Production (e as outras se quiser). **Nunca** exponha essa chave no frontend; ela é usada só no servidor (API `/api/tenants/create`).

### 3. Como Obter a Chave Pública do Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Em **Project API keys**, copie a chave **anon public** (não a service_role!)
5. Cole essa chave no campo **Value** da variável `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 4. Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo push para o repositório

## ⚠️ Importante

- A chave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` deve ser a **anon public key**, não a URL
- Não use a **service_role key** - ela é privada e não deve ser exposta no frontend
- Certifique-se de marcar todas as environments (Production, Preview, Development)

## ⚠️ Erro: Diretório de Saída "dist" Não Encontrado

Se você está vendo este erro após corrigir as variáveis de ambiente:

```
Error: No Output Directory named "dist" found after the Build completed.
```

Isso acontece quando o Vercel está configurado incorretamente como **Vite** (que usa "dist") em vez de **Next.js** (que usa ".next").

### Solução Passo a Passo

1. **Acesse as Configurações do Framework:**
   - Vá para https://vercel.com/dashboard
   - Selecione seu projeto
   - Vá em **Settings** > **General**
   - Role até a seção **Framework Settings**

2. **Altere o Framework Preset:**
   - No campo **Framework Preset**, você verá que está configurado como **"Vite"**
   - Clique no dropdown e selecione **"Next.js"**
   - Isso automaticamente atualizará:
     - **Build Command**: para `npm run build` (ou vazio para usar o padrão)
     - **Output Directory**: será removido/vazio (Next.js usa `.next` automaticamente)
     - **Development Command**: para `next dev`

3. **Salve as Alterações:**
   - Clique no botão **"Save"** no canto inferior direito
   - Aguarde a confirmação de que as configurações foram salvas

4. **Faça um Novo Deploy:**
   - Vá em **Deployments**
   - Clique nos três pontos (...) do último deployment
   - Selecione **Redeploy**
   - Ou faça um novo push para o repositório

### Nota sobre vercel.json

O arquivo `vercel.json` foi criado no projeto para ajudar na configuração, mas a correção principal deve ser feita no Dashboard da Vercel alterando o Framework Preset de "Vite" para "Next.js".

## 🔍 Verificação

Após configurar, o build deve passar sem erros. Se ainda houver problemas:

1. Verifique se as variáveis estão escritas corretamente (case-sensitive)
2. Verifique se todas as environments estão marcadas
3. Verifique se o Framework Preset está configurado como Next.js
4. Faça um redeploy após adicionar as variáveis ou alterar configurações
