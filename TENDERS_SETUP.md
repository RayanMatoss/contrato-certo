# Buscador de Licitações - Setup e Instruções

## 📋 Visão Geral

Sistema completo de busca e ingestão de licitações públicas, com arquitetura modular e suporte a múltiplas fontes de dados.

## 🗂️ Estrutura de Arquivos Criados

### Migrations SQL
- `supabase/migrations/009_tenders_schema.sql` - Schema completo (tabelas, índices, triggers)
- `supabase/migrations/010_tenders_search_function.sql` - Funções RPC de busca full-text
- `supabase/migrations/011_tenders_seed.sql` - Dados de teste (5 licitações)

### Código TypeScript

#### Core
- `src/lib/db/supabaseServer.ts` - Cliente Supabase server-side (service role)

#### Domain
- `src/modules/tenders/domain/types.ts` - Tipos TypeScript do domínio

#### Repository
- `src/modules/tenders/repositories/tenderRepository.ts` - Repositório com busca e queries

#### Connectors
- `src/modules/tenders/connectors/IConnector.ts` - Interface de conectores
- `src/modules/tenders/connectors/PNCPConnector.ts` - Conector PNCP (stub pronto para implementação)

#### Services
- `src/modules/tenders/services/IngestionService.ts` - Serviço de ingestão de dados

#### API Routes
- `src/app/api/tenders/search/route.ts` - Endpoint de busca
- `src/app/api/tenders/[id]/route.ts` - Endpoint de detalhe
- `src/app/api/tenders/ingest/route.ts` - Endpoint de ingestão (protegido)

#### UI
- `src/app/tenders/page.tsx` - Página de busca com filtros
- `src/app/tenders/[id]/page.tsx` - Página de detalhe da licitação

## 🔧 Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local`:

```env
# Supabase (já deve existir)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-public
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# PNCP (opcional - para integração futura)
PNCP_ENABLED=false
PNCP_BASE_URL=https://pncp.gov.br/api
PNCP_API_TOKEN=seu-token-aqui

# Ingestão (obrigatório para endpoint de ingestão)
INGEST_SECRET=seu-secret-aleatorio-aqui
```

**⚠️ IMPORTANTE:**
- `SUPABASE_SERVICE_ROLE_KEY` deve ser mantida em segredo (nunca expor no cliente)
- `INGEST_SECRET` deve ser uma string aleatória forte (ex: gerar com `openssl rand -hex 32`)

## 🚀 Comandos para Setup

### 1. Aplicar Migrations

```bash
# Se estiver usando Supabase CLI local
supabase migration up

# Ou aplicar manualmente via SQL Editor no Supabase Dashboard
# Execute na ordem: 009, 010, 011
```

### 2. Inserir Seed Data (Opcional)

```bash
# Via Supabase CLI
supabase db reset --db-url "postgresql://..."

# Ou executar manualmente o arquivo 011_tenders_seed.sql
```

### 3. Testar Build

```bash
npm run build
```

### 4. Rodar em Desenvolvimento

```bash
npm run dev
```

## 📝 Testando o Sistema

### 1. Testar Busca via API

```bash
# Busca simples
curl "http://localhost:3000/api/tenders/search?q=informática"

# Busca com filtros
curl "http://localhost:3000/api/tenders/search?uf=SP&modalidade=Pregão Eletrônico&page=1&pageSize=10"

# Buscar por ID
curl "http://localhost:3000/api/tenders/{id}"
```

### 2. Testar UI

1. Acesse `http://localhost:3000/tenders`
2. Use a busca e filtros para testar
3. Clique em uma licitação para ver detalhes

### 3. Testar Ingestão (com seed ou stub)

```bash
# Com autenticação
curl -X POST "http://localhost:3000/api/tenders/ingest?source=pncp" \
  -H "x-ingest-secret: seu-secret-aqui"

# Resposta esperada (com PNCP_ENABLED=false):
# {"success":true,"source":"pncp","result":{"inserted":0,"updated":0,"errors":0,...}}
```

## 🔍 Funcionalidades Implementadas

### ✅ Busca Full-Text
- Busca em português usando PostgreSQL `tsvector`
- Busca por objeto, órgão, município, modalidade, número
- Ordenação por relevância (quando há query) ou data de publicação

### ✅ Filtros
- UF (estado)
- Município
- Modalidade
- Status
- Período (data publicação)
- Faixa de valores (mínimo/máximo)

### ✅ Paginação
- Suporte a `page` e `pageSize`
- Retorna `total` de resultados

### ✅ Detalhes Completos
- Informações principais
- Itens da licitação (tabela)
- Documentos (links para download)
- Histórico de atualizações/eventos

### ✅ Ingestão
- Pipeline completo de ingestão
- Suporte a múltiplos conectores (interface pluggable)
- PNCP stub pronto para implementação
- UPSERT inteligente (evita duplicatas)
- Estado de sincronização por fonte

## 🏗️ Arquitetura

```
┌─────────────────┐
│   UI (Next.js)  │
│  /tenders/*     │
└────────┬────────┘
         │
┌────────▼────────┐
│  API Routes    │
│  /api/tenders/* │
└────────┬────────┘
         │
┌────────▼────────┐
│  Repository     │
│  tenderRepo     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Supabase DB    │
│  (PostgreSQL)   │
└─────────────────┘

┌─────────────────┐
│ Ingestion API   │
│  /ingest        │
└────────┬────────┘
         │
┌────────▼────────┐
│ IngestionService│
└────────┬────────┘
         │
┌────────▼────────┐
│  Connectors     │
│  (PNCP, etc)    │
└─────────────────┘
```

## 📊 Schema do Banco

### Tabelas Principais

- **tenders**: Licitações principais
- **tender_items**: Itens detalhados
- **tender_docs**: Documentos relacionados
- **tender_updates**: Histórico de eventos
- **ingestion_state**: Estado de sincronização

### Índices

- Full-text search: `tender_search` (GIN index)
- Filtros: `uf`, `municipio`, `modalidade`, `status`
- Datas: `data_publicacao`, `data_abertura` (DESC)
- Unicidade: `(source, source_id)`

## 🔐 Segurança

- Endpoint de ingestão protegido por `INGEST_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` usado apenas server-side
- Validação de parâmetros com Zod nas APIs
- Tratamento de erros padronizado

## 🚧 Próximos Passos (TODOs)

### PNCP Connector
- [ ] Implementar `discover()` com chamadas reais à API PNCP
- [ ] Implementar `fetchOne()` para buscar detalhes
- [ ] Mapear resposta da API para `RawTenderPayload`
- [ ] Implementar paginação/cursor conforme API PNCP
- [ ] Adicionar rate limiting e retry logic

### Melhorias
- [ ] Cache de resultados de busca (Redis ou similar)
- [ ] Webhooks para atualizações em tempo real
- [ ] Exportação de resultados (CSV, Excel)
- [ ] Alertas/notificações por email
- [ ] Dashboard de métricas de ingestão
- [ ] Suporte a mais conectores (Portal X, Diário Y, etc)

## 📚 Referências

- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PNCP API](https://pncp.gov.br) - Documentação oficial (quando disponível)

## 🐛 Troubleshooting

### Erro: "Missing env.SUPABASE_SERVICE_ROLE_KEY"
- Verifique se a variável está configurada no `.env.local`
- Reinicie o servidor de desenvolvimento após adicionar

### Erro: "Unauthorized" ao chamar `/api/tenders/ingest`
- Verifique se o header `x-ingest-secret` está correto
- Confirme que `INGEST_SECRET` no `.env.local` corresponde

### Busca não retorna resultados
- Verifique se o seed foi aplicado: `SELECT COUNT(*) FROM tenders;`
- Confirme que os índices foram criados: `\d+ tenders` no psql

### Build falha com erros de tipo
- Execute `npm run build` para ver erros detalhados
- Verifique se todas as dependências estão instaladas: `npm install`

## ✅ Checklist de Implementação

- [x] Schema SQL completo
- [x] Funções RPC de busca
- [x] Cliente Supabase server-side
- [x] Domain types TypeScript
- [x] Repositório com busca e queries
- [x] API routes (search, detail, ingest)
- [x] UI de busca com filtros
- [x] UI de detalhe completa
- [x] Interface de conectores
- [x] PNCP connector stub
- [x] Serviço de ingestão
- [x] Seed data para testes
- [x] Documentação completa

---

**Status:** ✅ MVP Funcional Completo
