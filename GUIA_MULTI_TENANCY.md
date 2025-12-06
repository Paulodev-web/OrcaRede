# 🔐 Sistema Multi-Tenancy (Multi-Usuário)

## 📋 Visão Geral

Este sistema implementa **isolamento estrito de dados** entre usuários, garantindo que cada usuário veja e manipule apenas seus próprios dados. Isso é alcançado através de:

1. **Coluna `user_id`** em todas as tabelas principais
2. **Row Level Security (RLS)** habilitado em todas as tabelas
3. **Políticas de segurança** que garantem isolamento automático
4. **Validações no frontend** para adicionar `user_id` em todas as operações

## 🗂️ Tabelas com `user_id`

### Tabelas Principais (com `user_id` direto)

1. **`materials`** - Materiais do catálogo
2. **`budgets`** - Orçamentos
3. **`budget_folders`** - Pastas de organização
4. **`utility_companies`** - Concessionárias
5. **`item_group_templates`** - Templates de grupos de itens
6. **`post_types`** - Tipos de postes

### Tabelas Relacionadas (isolamento via JOIN)

Estas tabelas herdam o isolamento através de suas tabelas pai:

- **`budget_posts`** → via `budgets`
- **`post_item_groups`** → via `budget_posts` → via `budgets`
- **`post_item_group_materials`** → via `post_item_groups` → via `budget_posts` → via `budgets`
- **`post_materials`** → via `budget_posts` → via `budgets`
- **`template_materials`** → via `item_group_templates`

## 🔒 Segurança Implementada

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado, garantindo que:

```sql
-- Exemplo para materials
CREATE POLICY "Users can view their own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);
```

### 4 Políticas por Tabela

Cada tabela principal tem 4 políticas:

1. **SELECT** - Usuários só veem seus próprios registros
2. **INSERT** - Usuários só criam registros com seu próprio `user_id`
3. **UPDATE** - Usuários só atualizam seus próprios registros
4. **DELETE** - Usuários só deletam seus próprios registros

### Políticas em Cascata

Tabelas relacionadas usam JOINs para verificar propriedade:

```sql
-- Exemplo para budget_posts
CREATE POLICY "Users can view their own budget posts"
  ON budget_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  );
```

## 📦 Migração Aplicada

A migration `20251202000000_add_multi_tenancy.sql` realiza:

1. ✅ Adiciona coluna `user_id` em todas as tabelas principais
2. ✅ Cria índices para performance
3. ✅ Habilita RLS em todas as tabelas
4. ✅ Cria políticas de segurança
5. ✅ Adiciona comentários explicativos

## 🚀 Como Aplicar a Migration

### Opção 1: Via Painel do Supabase (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/20251202000000_add_multi_tenancy.sql`
4. Cole e execute com **Run** ou `Ctrl+Enter`

### Opção 2: Via CLI do Supabase

```bash
# 1. Instalar CLI (se necessário)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Vincular ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Aplicar migration
supabase db push
```

## 📊 Migração de Dados Existentes

### ⚠️ IMPORTANTE: Dados Existentes

Após aplicar a migration, você precisa decidir o que fazer com dados existentes que não têm `user_id`:

#### Opção A: Atribuir a um usuário específico (Recomendado)

Se você tem um usuário principal ou administrador:

```sql
-- 1. Encontrar o ID do usuário
SELECT id, email FROM auth.users;

-- 2. Atribuir dados existentes ao usuário
-- Substitua 'SEU_USER_ID' pelo ID do usuário
UPDATE materials SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
UPDATE budgets SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
UPDATE utility_companies SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
UPDATE item_group_templates SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
UPDATE post_types SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
```

#### Opção B: Criar dados padrão por usuário

Se você quer que cada novo usuário tenha acesso a materiais/tipos de poste padrão, você pode:

1. Criar um sistema de "templates globais"
2. Copiar registros padrão quando um novo usuário se cadastra
3. Implementar isso no `AuthContext` após signup

#### Opção C: Deletar dados órfãos (Use com cuidado!)

```sql
-- ⚠️ CUIDADO: Isso deletará dados sem user_id
DELETE FROM materials WHERE user_id IS NULL;
DELETE FROM budgets WHERE user_id IS NULL;
-- etc...
```

## 💻 Código Atualizado

### AppContext.tsx

Todas as funções de criação agora validam e incluem `user_id`:

```typescript
const addMaterial = async (material: Omit<Material, 'id'>) => {
  if (!user?.id) {
    throw new Error('Usuário não autenticado');
  }

  const materialData = {
    // ... outros campos
    user_id: user.id, // Isolamento de dados
  };

  // ...
};
```

### Funções Atualizadas

- ✅ `addMaterial` - Adiciona material com `user_id`
- ✅ `addBudget` - Adiciona orçamento com `user_id`
- ✅ `addPostType` - Adiciona tipo de poste (e material) com `user_id`
- ✅ `addUtilityCompany` - Adiciona concessionária com `user_id`
- ✅ `addGroup` - Adiciona template de grupo com `user_id`
- ✅ `addFolder` - Adiciona pasta com `user_id`

## 🧪 Testando o Isolamento

### 1. Criar dois usuários

```javascript
// Usuário 1
const user1 = await supabase.auth.signUp({
  email: 'usuario1@exemplo.com',
  password: 'senha123',
});

// Usuário 2
const user2 = await supabase.auth.signUp({
  email: 'usuario2@exemplo.com',
  password: 'senha123',
});
```

### 2. Fazer login com Usuário 1 e criar dados

```javascript
// Login com usuário 1
await supabase.auth.signInWithPassword({
  email: 'usuario1@exemplo.com',
  password: 'senha123',
});

// Criar material
const { data } = await supabase.from('materials').insert({
  name: 'Material do Usuário 1',
  code: 'MAT001',
  unit: 'unidade',
  price: 100,
  user_id: user1.id,
});
```

### 3. Fazer login com Usuário 2 e tentar acessar

```javascript
// Login com usuário 2
await supabase.auth.signInWithPassword({
  email: 'usuario2@exemplo.com',
  password: 'senha123',
});

// Tentar buscar materiais (só verá os dele, não os do usuário 1)
const { data } = await supabase.from('materials').select('*');
// data = [] (vazio, não vê materiais do usuário 1)
```

## 📈 Performance

### Índices Criados

Para garantir performance, foram criados índices em todas as colunas `user_id`:

```sql
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_utility_companies_user_id ON utility_companies(user_id);
CREATE INDEX idx_item_group_templates_user_id ON item_group_templates(user_id);
CREATE INDEX idx_post_types_user_id ON post_types(user_id);
```

Isso garante que queries filtradas por `user_id` sejam extremamente rápidas.

## 🔍 Verificando a Implementação

### Verificar RLS Habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Verificar Políticas Criadas

```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Verificar Índices

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%user_id%';
```

## ⚠️ Considerações Importantes

### 1. Dados Compartilhados

Se você precisar de dados compartilhados entre usuários (ex: catálogo global de materiais):

- Crie uma tabela separada (ex: `public_materials`)
- Ou implemente lógica especial nas políticas RLS

### 2. Administradores

Se você tiver usuários administradores que devem ver todos os dados:

```sql
-- Exemplo de política para admins
CREATE POLICY "Admins can view all materials"
  ON materials FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 3. Backup e Restore

Ao fazer backup/restore:
- Os `user_id`s serão preservados
- Certifique-se de que os usuários existem na tabela `auth.users`

## 📚 Recursos Adicionais

- [Documentação do Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guia de Políticas RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Multi-tenancy no PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## ✅ Checklist de Implementação

- [x] Migration criada e documentada
- [x] RLS habilitado em todas as tabelas
- [x] Políticas de segurança implementadas
- [x] Índices criados para performance
- [x] AppContext atualizado com `user_id`
- [x] Validações de autenticação adicionadas
- [ ] Migration aplicada no banco de dados
- [ ] Dados existentes migrados (se aplicável)
- [ ] Testes de isolamento realizados
- [ ] Documentação revisada

## 🎯 Próximos Passos

1. **Aplicar a migration** no ambiente de desenvolvimento
2. **Testar o isolamento** com múltiplos usuários
3. **Migrar dados existentes** se houver
4. **Aplicar em produção** após validação completa
5. **Monitorar performance** das queries com RLS

