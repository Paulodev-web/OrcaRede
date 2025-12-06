# 🚀 Instruções Rápidas - Deploy Multi-Tenancy

## ⚡ Guia Rápido (5 Passos)

### 1️⃣ Aplicar Migration no Supabase

**Via Dashboard (Mais Fácil):**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo de `supabase/migrations/20251202000000_add_multi_tenancy.sql`
6. Cole no editor
7. Clique em **Run** (ou `Ctrl+Enter`)

**Via CLI (Alternativa):**

```bash
# Se já tiver CLI configurado
supabase db push
```

### 2️⃣ Verificar Aplicação

Execute esta query no SQL Editor para confirmar:

```sql
-- Verificar se user_id foi adicionado
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE column_name = 'user_id' 
AND table_schema = 'public'
ORDER BY table_name;

-- Deve mostrar: materials, budgets, utility_companies, 
-- item_group_templates, post_types, budget_folders
```

### 3️⃣ Migrar Dados Existentes (Se Necessário)

**Importante:** Se você já tem dados no sistema, precisa atribuí-los a um usuário.

```sql
-- 1. Encontrar seu user ID
SELECT id, email FROM auth.users;

-- 2. Copiar o ID do usuário desejado

-- 3. Editar e executar o script
-- Abra: scripts/migrate_existing_data.sql
-- Substitua 'SEU_USER_ID_AQUI' pelo ID copiado
-- Execute no SQL Editor
```

### 4️⃣ Fazer Deploy do Código

```bash
# O código já está pronto, apenas faça commit e push
git add .
git commit -m "feat: Implementa sistema multi-tenancy com RLS"
git push origin main

# Se estiver usando Vercel/Netlify, o deploy será automático
```

### 5️⃣ Testar Isolamento

1. **Criar usuário de teste 1:**
   - Faça signup com email1@teste.com
   - Crie alguns materiais/orçamentos

2. **Criar usuário de teste 2:**
   - Faça logout
   - Faça signup com email2@teste.com
   - Verifique que NÃO vê os dados do usuário 1 ✅

3. **Confirmar isolamento:**
   - Faça login novamente com usuário 1
   - Verifique que vê seus dados ✅

## ✅ Checklist de Validação

Execute após cada passo:

```sql
-- ✅ PASSO 1: Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'materials', 'budgets', 'utility_companies', 
  'item_group_templates', 'post_types', 'budget_posts',
  'post_item_groups', 'post_materials', 
  'post_item_group_materials', 'template_materials'
);
-- Todas devem ter rowsecurity = true

-- ✅ PASSO 2: Verificar políticas criadas
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Cada tabela deve ter 4 políticas

-- ✅ PASSO 3: Verificar índices
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%user_id%';
-- Deve mostrar índices para todas as tabelas com user_id

-- ✅ PASSO 4: Verificar dados órfãos
SELECT 
  'materials' as tabela, 
  COUNT(*) as registros_sem_user_id 
FROM materials WHERE user_id IS NULL
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets WHERE user_id IS NULL
UNION ALL
SELECT 'utility_companies', COUNT(*) FROM utility_companies WHERE user_id IS NULL
UNION ALL
SELECT 'item_group_templates', COUNT(*) FROM item_group_templates WHERE user_id IS NULL
UNION ALL
SELECT 'post_types', COUNT(*) FROM post_types WHERE user_id IS NULL;
-- Todos devem ser 0 após migração de dados
```

## 🔥 Comandos Úteis

### Reverter Migration (Se Necessário)

```sql
-- ⚠️ CUIDADO: Isso remove todas as políticas e user_id
-- Use apenas em desenvolvimento!

-- Desabilitar RLS
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE utility_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_group_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_item_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_item_group_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_materials DISABLE ROW LEVEL SECURITY;

-- Remover colunas user_id (se necessário)
ALTER TABLE materials DROP COLUMN IF EXISTS user_id;
ALTER TABLE budgets DROP COLUMN IF EXISTS user_id;
ALTER TABLE utility_companies DROP COLUMN IF EXISTS user_id;
ALTER TABLE item_group_templates DROP COLUMN IF EXISTS user_id;
ALTER TABLE post_types DROP COLUMN IF EXISTS user_id;
```

### Atribuir Dados a Usuário Específico

```sql
-- Atribuir todos os dados a um usuário
UPDATE materials SET user_id = 'UUID_DO_USUARIO' WHERE user_id IS NULL;
UPDATE budgets SET user_id = 'UUID_DO_USUARIO' WHERE user_id IS NULL;
UPDATE utility_companies SET user_id = 'UUID_DO_USUARIO' WHERE user_id IS NULL;
UPDATE item_group_templates SET user_id = 'UUID_DO_USUARIO' WHERE user_id IS NULL;
UPDATE post_types SET user_id = 'UUID_DO_USUARIO' WHERE user_id IS NULL;
```

### Debug de Políticas RLS

```sql
-- Ver todas as políticas de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'materials';

-- Testar se RLS está funcionando (como usuário específico)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub = 'UUID_DO_USUARIO';
SELECT * FROM materials;
-- Deve retornar apenas materiais do usuário
```

## 📝 Notas Importantes

### ✅ O que JÁ está pronto:
- Migration completa
- Políticas RLS configuradas
- Código do backend atualizado
- Validações de autenticação
- Documentação completa

### ⚠️ O que VOCÊ precisa fazer:
1. Aplicar a migration no banco
2. Migrar dados existentes (se houver)
3. Testar o isolamento
4. Deploy (código já está pronto)

### 🎯 Após o Deploy:
- A aplicação continua funcionando normalmente
- Cada usuário verá apenas seus dados
- Nenhuma alteração na interface
- Zero impacto na experiência do usuário

## 🆘 Problemas Comuns

### "Erro ao criar material"

**Solução:**
- Verifique se o usuário está logado
- Verifique se a migration foi aplicada
- Veja os logs do navegador (Console)

### "Não vejo meus dados antigos"

**Solução:**
- Execute o script `scripts/migrate_existing_data.sql`
- Atribua os dados existentes ao seu usuário

### "RLS está bloqueando tudo"

**Solução:**
```sql
-- Verificar se as políticas foram criadas
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Se não houver políticas, re-executar a migration
```

## 📞 Suporte

- **Documentação Completa:** `GUIA_MULTI_TENANCY.md`
- **Resumo Executivo:** `RESUMO_MULTI_TENANCY.md`
- **Script de Migração:** `scripts/migrate_existing_data.sql`

## 🎉 Pronto!

Após seguir estes 5 passos, seu sistema estará com multi-tenancy completo e funcionando!

---

**Tempo estimado:** 10-15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)  
**Reversível:** ✅ Sim (com script de rollback)

