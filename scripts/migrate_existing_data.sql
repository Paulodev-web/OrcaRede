-- ===============================================
-- SCRIPT DE MIGRAÇÃO DE DADOS EXISTENTES
-- ===============================================
-- Este script atribui user_id aos dados existentes que não têm proprietário
-- Execute APÓS aplicar a migration principal (20251202000000_add_multi_tenancy.sql)
-- ===============================================

-- ⚠️ IMPORTANTE: Edite este script antes de executar!
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real do usuário que deve receber os dados

-- ===============================================
-- PASSO 1: ENCONTRAR O USER_ID
-- ===============================================
-- Execute esta query primeiro para ver os usuários disponíveis:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Copie o ID do usuário desejado e cole na variável abaixo:
DO $$
DECLARE
  target_user_id UUID := 'SEU_USER_ID_AQUI'; -- ⚠️ EDITE AQUI
  total_materials INTEGER;
  total_budgets INTEGER;
  total_companies INTEGER;
  total_templates INTEGER;
  total_post_types INTEGER;
BEGIN
  -- Verificar se o user_id existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User ID % não encontrado na tabela auth.users', target_user_id;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Iniciando migração de dados existentes';
  RAISE NOTICE 'User ID de destino: %', target_user_id;
  RAISE NOTICE '========================================';

  -- ===============================================
  -- MIGRAR MATERIALS
  -- ===============================================
  SELECT COUNT(*) INTO total_materials FROM materials WHERE user_id IS NULL;
  
  IF total_materials > 0 THEN
    UPDATE materials 
    SET user_id = target_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Materials: % registros atualizados', total_materials;
  ELSE
    RAISE NOTICE '✓ Materials: Nenhum registro órfão encontrado';
  END IF;

  -- ===============================================
  -- MIGRAR BUDGETS
  -- ===============================================
  SELECT COUNT(*) INTO total_budgets FROM budgets WHERE user_id IS NULL;
  
  IF total_budgets > 0 THEN
    UPDATE budgets 
    SET user_id = target_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Budgets: % registros atualizados', total_budgets;
  ELSE
    RAISE NOTICE '✓ Budgets: Nenhum registro órfão encontrado';
  END IF;

  -- ===============================================
  -- MIGRAR UTILITY_COMPANIES
  -- ===============================================
  SELECT COUNT(*) INTO total_companies FROM utility_companies WHERE user_id IS NULL;
  
  IF total_companies > 0 THEN
    UPDATE utility_companies 
    SET user_id = target_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Utility Companies: % registros atualizados', total_companies;
  ELSE
    RAISE NOTICE '✓ Utility Companies: Nenhum registro órfão encontrado';
  END IF;

  -- ===============================================
  -- MIGRAR ITEM_GROUP_TEMPLATES
  -- ===============================================
  SELECT COUNT(*) INTO total_templates FROM item_group_templates WHERE user_id IS NULL;
  
  IF total_templates > 0 THEN
    UPDATE item_group_templates 
    SET user_id = target_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Item Group Templates: % registros atualizados', total_templates;
  ELSE
    RAISE NOTICE '✓ Item Group Templates: Nenhum registro órfão encontrado';
  END IF;

  -- ===============================================
  -- MIGRAR POST_TYPES
  -- ===============================================
  SELECT COUNT(*) INTO total_post_types FROM post_types WHERE user_id IS NULL;
  
  IF total_post_types > 0 THEN
    UPDATE post_types 
    SET user_id = target_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Post Types: % registros atualizados', total_post_types;
  ELSE
    RAISE NOTICE '✓ Post Types: Nenhum registro órfão encontrado';
  END IF;

  -- ===============================================
  -- RESUMO FINAL
  -- ===============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migração concluída com sucesso!';
  RAISE NOTICE 'Total de registros migrados: %', 
    total_materials + total_budgets + total_companies + total_templates + total_post_types;
  RAISE NOTICE '========================================';
END $$;

-- ===============================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ===============================================
-- Execute estas queries para verificar se ainda há registros órfãos:

SELECT 'materials' as tabela, COUNT(*) as registros_orfaos FROM materials WHERE user_id IS NULL
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets WHERE user_id IS NULL
UNION ALL
SELECT 'utility_companies', COUNT(*) FROM utility_companies WHERE user_id IS NULL
UNION ALL
SELECT 'item_group_templates', COUNT(*) FROM item_group_templates WHERE user_id IS NULL
UNION ALL
SELECT 'post_types', COUNT(*) FROM post_types WHERE user_id IS NULL;

-- Se todos os valores forem 0, a migração foi bem-sucedida!
-- ===============================================
-- OPCIONAL: TORNAR user_id OBRIGATÓRIO (NOT NULL)
-- ===============================================
-- Execute APENAS se todos os registros tiverem user_id atribuído:
/*
ALTER TABLE materials ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE utility_companies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE item_group_templates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE post_types ALTER COLUMN user_id SET NOT NULL;
*/

-- NOTA: Não é necessário tornar NOT NULL para o RLS funcionar.
-- As políticas RLS já garantem o isolamento.

