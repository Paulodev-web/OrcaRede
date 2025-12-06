-- ===============================================
-- MIGRATION: Multi-Tenancy (Isolamento de Dados por Usuário)
-- Data: 2024-12-02
-- Descrição: Adiciona user_id em todas as tabelas relevantes e
--            implementa Row Level Security (RLS) para isolamento estrito de dados
-- ===============================================

-- ===============================================
-- PARTE 1: ADICIONAR COLUNA user_id
-- ===============================================

-- 1. Tabela: materials
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Tabela: budgets (já pode ter folder_id)
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Tabela: utility_companies
ALTER TABLE utility_companies 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Tabela: item_group_templates
ALTER TABLE item_group_templates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Tabela: post_types
ALTER TABLE post_types 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTA: As tabelas relacionadas (budget_posts, post_item_groups, post_item_group_materials,
-- post_materials, template_materials) herdarão o user_id através de JOINs com suas tabelas pai

-- ===============================================
-- PARTE 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_companies_user_id ON utility_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_item_group_templates_user_id ON item_group_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_post_types_user_id ON post_types(user_id);

-- ===============================================
-- PARTE 3: ATUALIZAR DADOS EXISTENTES
-- ===============================================
-- IMPORTANTE: Esta seção precisa ser ajustada de acordo com sua estratégia
-- Opção 1: Atribuir todos os dados existentes a um usuário específico
-- Opção 2: Manter dados existentes como "compartilhados" (não recomendado)
-- Opção 3: Criar script de migração de dados separado

-- Para desenvolvimento, vamos deixar NULL por enquanto
-- Em produção, você deve decidir como tratar dados existentes

-- ===============================================
-- PARTE 4: HABILITAR ROW LEVEL SECURITY (RLS)
-- ===============================================

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_group_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_item_group_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_materials ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PARTE 5: CRIAR POLÍTICAS RLS - MATERIALS
-- ===============================================

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;

-- Criar novas políticas
CREATE POLICY "Users can view their own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON materials FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- PARTE 6: CRIAR POLÍTICAS RLS - BUDGETS
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- PARTE 7: CRIAR POLÍTICAS RLS - UTILITY_COMPANIES
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own companies" ON utility_companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON utility_companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON utility_companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON utility_companies;

CREATE POLICY "Users can view their own companies"
  ON utility_companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
  ON utility_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON utility_companies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON utility_companies FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- PARTE 8: CRIAR POLÍTICAS RLS - ITEM_GROUP_TEMPLATES
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own templates" ON item_group_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON item_group_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON item_group_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON item_group_templates;

CREATE POLICY "Users can view their own templates"
  ON item_group_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON item_group_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON item_group_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON item_group_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- PARTE 9: CRIAR POLÍTICAS RLS - POST_TYPES
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own post types" ON post_types;
DROP POLICY IF EXISTS "Users can insert their own post types" ON post_types;
DROP POLICY IF EXISTS "Users can update their own post types" ON post_types;
DROP POLICY IF EXISTS "Users can delete their own post types" ON post_types;

CREATE POLICY "Users can view their own post types"
  ON post_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post types"
  ON post_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post types"
  ON post_types FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post types"
  ON post_types FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- PARTE 10: POLÍTICAS RLS - BUDGET_POSTS (via budgets)
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own budget posts" ON budget_posts;
DROP POLICY IF EXISTS "Users can insert their own budget posts" ON budget_posts;
DROP POLICY IF EXISTS "Users can update their own budget posts" ON budget_posts;
DROP POLICY IF EXISTS "Users can delete their own budget posts" ON budget_posts;

CREATE POLICY "Users can view their own budget posts"
  ON budget_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own budget posts"
  ON budget_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own budget posts"
  ON budget_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own budget posts"
  ON budget_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_posts.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- ===============================================
-- PARTE 11: POLÍTICAS RLS - POST_ITEM_GROUPS (via budget_posts)
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own post item groups" ON post_item_groups;
DROP POLICY IF EXISTS "Users can insert their own post item groups" ON post_item_groups;
DROP POLICY IF EXISTS "Users can update their own post item groups" ON post_item_groups;
DROP POLICY IF EXISTS "Users can delete their own post item groups" ON post_item_groups;

CREATE POLICY "Users can view their own post item groups"
  ON post_item_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_item_groups.budget_post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own post item groups"
  ON post_item_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_item_groups.budget_post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own post item groups"
  ON post_item_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_item_groups.budget_post_id
      AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_item_groups.budget_post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own post item groups"
  ON post_item_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_item_groups.budget_post_id
      AND b.user_id = auth.uid()
    )
  );

-- ===============================================
-- PARTE 12: POLÍTICAS RLS - POST_ITEM_GROUP_MATERIALS (via post_item_groups)
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own post item group materials" ON post_item_group_materials;
DROP POLICY IF EXISTS "Users can insert their own post item group materials" ON post_item_group_materials;
DROP POLICY IF EXISTS "Users can update their own post item group materials" ON post_item_group_materials;
DROP POLICY IF EXISTS "Users can delete their own post item group materials" ON post_item_group_materials;

CREATE POLICY "Users can view their own post item group materials"
  ON post_item_group_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM post_item_groups pig
      JOIN budget_posts bp ON bp.id = pig.budget_post_id
      JOIN budgets b ON b.id = bp.budget_id
      WHERE pig.id = post_item_group_materials.post_item_group_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own post item group materials"
  ON post_item_group_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM post_item_groups pig
      JOIN budget_posts bp ON bp.id = pig.budget_post_id
      JOIN budgets b ON b.id = bp.budget_id
      WHERE pig.id = post_item_group_materials.post_item_group_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own post item group materials"
  ON post_item_group_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM post_item_groups pig
      JOIN budget_posts bp ON bp.id = pig.budget_post_id
      JOIN budgets b ON b.id = bp.budget_id
      WHERE pig.id = post_item_group_materials.post_item_group_id
      AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM post_item_groups pig
      JOIN budget_posts bp ON bp.id = pig.budget_post_id
      JOIN budgets b ON b.id = bp.budget_id
      WHERE pig.id = post_item_group_materials.post_item_group_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own post item group materials"
  ON post_item_group_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM post_item_groups pig
      JOIN budget_posts bp ON bp.id = pig.budget_post_id
      JOIN budgets b ON b.id = bp.budget_id
      WHERE pig.id = post_item_group_materials.post_item_group_id
      AND b.user_id = auth.uid()
    )
  );

-- ===============================================
-- PARTE 13: POLÍTICAS RLS - POST_MATERIALS (via budget_posts)
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own post materials" ON post_materials;
DROP POLICY IF EXISTS "Users can insert their own post materials" ON post_materials;
DROP POLICY IF EXISTS "Users can update their own post materials" ON post_materials;
DROP POLICY IF EXISTS "Users can delete their own post materials" ON post_materials;

CREATE POLICY "Users can view their own post materials"
  ON post_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_materials.post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own post materials"
  ON post_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_materials.post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own post materials"
  ON post_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_materials.post_id
      AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_materials.post_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own post materials"
  ON post_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budget_posts bp
      JOIN budgets b ON b.id = bp.budget_id
      WHERE bp.id = post_materials.post_id
      AND b.user_id = auth.uid()
    )
  );

-- ===============================================
-- PARTE 14: POLÍTICAS RLS - TEMPLATE_MATERIALS (via item_group_templates)
-- ===============================================

DROP POLICY IF EXISTS "Users can view their own template materials" ON template_materials;
DROP POLICY IF EXISTS "Users can insert their own template materials" ON template_materials;
DROP POLICY IF EXISTS "Users can update their own template materials" ON template_materials;
DROP POLICY IF EXISTS "Users can delete their own template materials" ON template_materials;

CREATE POLICY "Users can view their own template materials"
  ON template_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM item_group_templates igt
      WHERE igt.id = template_materials.template_id
      AND igt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own template materials"
  ON template_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM item_group_templates igt
      WHERE igt.id = template_materials.template_id
      AND igt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own template materials"
  ON template_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM item_group_templates igt
      WHERE igt.id = template_materials.template_id
      AND igt.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM item_group_templates igt
      WHERE igt.id = template_materials.template_id
      AND igt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own template materials"
  ON template_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM item_group_templates igt
      WHERE igt.id = template_materials.template_id
      AND igt.user_id = auth.uid()
    )
  );

-- ===============================================
-- PARTE 15: COMENTÁRIOS EXPLICATIVOS
-- ===============================================

COMMENT ON COLUMN materials.user_id IS 'ID do usuário proprietário do material';
COMMENT ON COLUMN budgets.user_id IS 'ID do usuário proprietário do orçamento';
COMMENT ON COLUMN utility_companies.user_id IS 'ID do usuário proprietário da concessionária';
COMMENT ON COLUMN item_group_templates.user_id IS 'ID do usuário proprietário do template de grupo';
COMMENT ON COLUMN post_types.user_id IS 'ID do usuário proprietário do tipo de poste';

-- ===============================================
-- PARTE 16: FUNÇÃO HELPER PARA VERIFICAR PROPRIEDADE
-- ===============================================

-- Função auxiliar para verificar se um budget pertence ao usuário
CREATE OR REPLACE FUNCTION user_owns_budget(budget_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM budgets
    WHERE id = budget_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- FIM DA MIGRATION
-- ===============================================

-- NOTAS IMPORTANTES:
-- 1. Esta migration adiciona user_id mas NÃO força NOT NULL ainda
-- 2. Você precisa popular os user_ids existentes antes de tornar NOT NULL
-- 3. As políticas RLS garantem isolamento estrito de dados
-- 4. Tabelas relacionadas herdam segurança via JOINs
-- 5. Teste em ambiente de desenvolvimento antes de aplicar em produção

