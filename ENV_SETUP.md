# Configuração de Variáveis de Ambiente

## Problema Identificado

O arquivo `.env` está usando variáveis com prefixo `VITE_` (para Vite), mas o Next.js precisa de variáveis com prefixo `NEXT_PUBLIC_`.

Além disso, o valor de `VITE_SUPABASE_PUBLISHABLE_KEY` está incorreto - contém a URL em vez da chave pública.

## Solução

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://egnziasbgdbqatpofveq.supabase.co

# Chave pública (anon key) do Supabase
# IMPORTANTE: Esta deve ser a chave "anon" ou "public" do Supabase, não a URL!
# Você encontra essa chave em: Supabase Dashboard > Settings > API > Project API keys > anon public
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui

# ID do projeto (opcional, para gerar tipos)
SUPABASE_PROJECT_ID=egnziasbgdbqatpofveq
```

## Como obter a chave pública do Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Em **Project API keys**, copie a chave **anon public** (não a service_role!)
5. Cole essa chave no `.env.local` como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Nota

O código foi atualizado para aceitar tanto `NEXT_PUBLIC_*` quanto `VITE_*` como fallback, mas é recomendado usar `NEXT_PUBLIC_*` para Next.js.
