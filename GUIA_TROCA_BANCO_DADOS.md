# 🔄 Guia para Trocar o Banco de Dados Supabase

Este guia explica como desconectar o projeto do banco de dados atual e conectar em outro.

## 📋 Pré-requisitos

1. Acesso ao novo projeto Supabase
2. URL e chave anon do novo projeto
3. As migrações do banco de dados (se necessário)

## 🔧 Passo 1: Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# URL do seu novo projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key) do seu novo projeto Supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### Como obter essas informações:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu novo projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 🔄 Passo 2: Limpar sessão de autenticação (opcional)

Se você já estava logado no banco antigo, é recomendado limpar o localStorage do navegador:

1. Abra o DevTools (F12)
2. Vá na aba **Application** (Chrome) ou **Storage** (Firefox)
3. Encontre **Local Storage** → seu domínio
4. Delete as chaves relacionadas ao Supabase (geralmente começam com `sb-`)

Ou simplesmente faça logout antes de trocar as credenciais.

## 📦 Passo 3: Aplicar migrações no novo banco (se necessário)

Se o novo banco de dados ainda não tem as tabelas e estrutura necessárias, você precisa aplicar as migrações:

### Opção A: Via Painel do Supabase (Recomendado)

1. Acesse o **SQL Editor** no painel do Supabase
2. Execute as migrações na ordem:
   - `supabase/migrations/20251020174108_alter_quantity_to_numeric.sql`
   - `supabase/migrations/20251111000000_create_budget_folders.sql`
   - `supabase/migrations/20251127000000_add_render_version.sql`

### Opção B: Via CLI do Supabase

```bash
# 1. Fazer login no Supabase CLI
supabase login

# 2. Vincular ao novo projeto
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplicar todas as migrações
supabase db push
```

## ✅ Passo 4: Verificar a conexão

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Tente fazer login no sistema
3. Verifique se os dados estão sendo carregados corretamente

## ⚠️ Observações Importantes

- **Dados**: Os dados do banco antigo não serão transferidos automaticamente. Se precisar migrar dados, faça isso manualmente ou use ferramentas de exportação/importação.

- **Autenticação**: Usuários precisarão criar novas contas no novo banco ou você precisará migrar os usuários manualmente.

- **RLS (Row Level Security)**: Certifique-se de que as políticas RLS estão configuradas corretamente no novo banco.

- **Variáveis de ambiente**: O arquivo `.env` está no `.gitignore` e não será commitado. Cada desenvolvedor precisa criar seu próprio arquivo.

## 🐛 Troubleshooting

### Erro: "Missing environment variable"
- Verifique se o arquivo `.env` está na raiz do projeto
- Certifique-se de que as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento após criar/modificar o `.env`

### Erro de autenticação
- Limpe o localStorage do navegador
- Verifique se as credenciais estão corretas
- Confirme que o novo projeto tem autenticação habilitada

### Dados não aparecem
- Verifique se as migrações foram aplicadas
- Confirme que as tabelas existem no novo banco
- Verifique as políticas RLS

