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

## 🔍 Verificação

Após configurar, o build deve passar sem erros. Se ainda houver problemas:

1. Verifique se as variáveis estão escritas corretamente (case-sensitive)
2. Verifique se todas as environments estão marcadas
3. Faça um redeploy após adicionar as variáveis
