# Configuração do Supabase - Contrato Certo

Este documento descreve como configurar e aplicar as migrations do Supabase para o projeto Contrato Certo.

## Pré-requisitos

1. Conta no Supabase criada
2. Projeto criado no Supabase
3. Variáveis de ambiente configuradas no arquivo `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   SUPABASE_PROJECT_ID=seu_project_id
   ```

## Estrutura das Migrations

As migrations estão organizadas em 4 arquivos:

1. **001_initial_schema.sql**: Criação de ENUMs, extensões e todas as tabelas
2. **002_rls_policies.sql**: Configuração de Row Level Security (RLS)
3. **003_functions_triggers.sql**: Funções utilitárias e triggers automáticos
4. **004_storage_setup.sql**: Configuração de storage buckets

## Como Aplicar as Migrations

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o Dashboard do seu projeto no Supabase
2. Vá em **SQL Editor**
3. Abra cada arquivo de migration na ordem (001, 002, 003, 004)
4. Execute cada migration clicando em **Run**

### Opção 2: Via CLI do Supabase

Se você tem o Supabase CLI instalado:

```bash
# Conectar ao projeto remoto
supabase link --project-ref seu-project-ref

# Aplicar todas as migrations
supabase db push
```

### Opção 3: Via API do Supabase

Você pode usar a API do Supabase para executar as migrations programaticamente.

## Configuração de Storage

Após aplicar as migrations, você precisa criar o bucket de storage manualmente:

1. Acesse **Storage** no Dashboard do Supabase
2. Clique em **New bucket**
3. Nome: `documents`
4. Público: **Não** (privado)
5. As policies RLS já estão configuradas na migration 004

## Gerar Tipos TypeScript

Após aplicar as migrations, gere os tipos TypeScript:

```bash
npm run supabase:types
```

Isso atualizará o arquivo `src/integrations/supabase/types.ts` com todos os tipos do banco de dados.

## Estrutura do Banco de Dados

### Tabelas Principais

- **tenants**: Empresas/Organizações (multi-tenancy)
- **users**: Usuários do sistema
- **tenant_memberships**: Relação usuário-tenant com roles
- **clients**: Clientes
- **contracts**: Contratos
- **invoices**: Notas Fiscais
- **tasks**: Tarefas
- **documents**: Documentos
- **financial_categories**: Categorias Financeiras
- **cost_centers**: Centros de Custo

### ENUMs

- `user_role`: Roles de usuário
- `contract_status`: Status de contratos
- `adjustment_index`: Índices de reajuste
- `invoice_status`: Status de notas fiscais
- `task_status`: Status de tarefas
- `task_type`: Tipos de tarefas
- `document_type`: Tipos de documentos
- `financial_type`: Tipos financeiros

### Funções Úteis

- `get_user_tenant_id()`: Obtém o tenant_id do usuário autenticado
- `get_dashboard_metrics(tenant_id)`: Métricas do dashboard
- `get_contracts_expiring_soon(tenant_id, days)`: Contratos próximos do vencimento
- `get_overdue_invoices(tenant_id)`: Notas fiscais vencidas
- `calculate_invoice_totals(invoice_id)`: Calcula totais de uma nota fiscal
- `get_expiring_documents(tenant_id, days)`: Documentos expirando em breve
- `get_user_pending_tasks(tenant_id, user_id)`: Tarefas pendentes do usuário

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com policies que garantem:

- Usuários só podem ver dados do seu tenant
- Usuários só podem inserir/atualizar dados no seu tenant
- Apenas admins podem deletar registros (exceto tasks e documents)

## Próximos Passos

1. Aplicar as migrations no Supabase
2. Criar o bucket de storage `documents`
3. Gerar os tipos TypeScript
4. Configurar autenticação no Supabase (se ainda não estiver)
5. Testar a conexão e queries básicas

## Notas Importantes

- As migrations devem ser aplicadas na ordem (001, 002, 003, 004)
- O bucket de storage precisa ser criado manualmente no Dashboard
- Certifique-se de que as variáveis de ambiente estão corretas
- Teste as policies RLS após a configuração
