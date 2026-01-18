# Contrato Certo

Sistema de gestão de contratos desenvolvido com Next.js, React, TypeScript e shadcn-ui.

## Como executar o projeto

### Pré-requisitos

- Node.js & npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Passos para executar

```sh
# Passo 1: Instalar as dependências
npm i

# Passo 2: Configurar variáveis de ambiente
# Crie um arquivo .env.local com as seguintes variáveis:
# NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_do_supabase

# Passo 3: Iniciar o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## Tecnologias utilizadas

Este projeto foi construído com:

- Next.js 15
- TypeScript
- React 18
- shadcn-ui
- Tailwind CSS
- Supabase
- TanStack Query

## Scripts disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes
- `npm run test:watch` - Executa os testes em modo watch

## Estrutura do projeto

```
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial
│   ├── globals.css        # Estilos globais
│   └── [rotas]/           # Rotas da aplicação
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/             # Componentes de página
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários
│   └── integrations/      # Integrações (Supabase, etc.)
└── public/                # Arquivos estáticos
```

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_do_supabase
```
