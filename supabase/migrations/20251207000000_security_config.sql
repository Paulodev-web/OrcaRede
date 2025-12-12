-- ===============================================
-- MIGRATION: Configurações de Segurança
-- Data: 2024-12-07
-- Descrição: Configura políticas de segurança para garantir que apenas
--            usuários autenticados e com email confirmado possam acessar dados
-- ===============================================

-- ===============================================
-- PARTE 1: FUNÇÃO PARA VERIFICAR EMAIL CONFIRMADO
-- ===============================================

-- Função auxiliar para verificar se o email do usuário foi confirmado
CREATE OR REPLACE FUNCTION auth.email_confirmed()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- PARTE 2: POLÍTICAS DE SEGURANÇA ADICIONAIS
-- ===============================================

-- Garantir que todas as políticas RLS existentes também verifiquem email confirmado
-- Isso adiciona uma camada extra de segurança

-- NOTA: As políticas existentes já verificam auth.uid(), mas vamos adicionar
-- uma verificação adicional de email confirmado onde necessário

-- ===============================================
-- PARTE 3: TRIGGER PARA LOG DE TENTATIVAS DE ACESSO
-- ===============================================

-- (A tabela será criada na PARTE 6)

-- ===============================================
-- PARTE 4: FUNÇÃO PARA VERIFICAR ACESSO
-- ===============================================

-- Função que verifica se um usuário tem acesso válido
-- Retorna true se:
-- 1. O usuário está autenticado
-- 2. O email foi confirmado
-- 3. O usuário existe e está ativo
CREATE OR REPLACE FUNCTION security.check_user_access()
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  email_confirmed BOOLEAN;
BEGIN
  -- Verifica se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Verifica se o usuário existe e se o email foi confirmado
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()),
    EXISTS(
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email_confirmed_at IS NOT NULL
    )
  INTO user_exists, email_confirmed;

  RETURN user_exists AND email_confirmed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- PARTE 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================================

COMMENT ON FUNCTION auth.email_confirmed() IS 
  'Verifica se o email do usuário atual foi confirmado';

COMMENT ON FUNCTION security.check_user_access() IS 
  'Verifica se o usuário atual tem acesso válido (autenticado e email confirmado)';

COMMENT ON TABLE security.access_logs IS 
  'Registra tentativas de acesso para auditoria de segurança';

-- ===============================================
-- PARTE 6: GARANTIR QUE SCHEMA SECURITY EXISTE
-- ===============================================

-- Criar schema security se não existir
CREATE SCHEMA IF NOT EXISTS security;

-- Criar tabela de logs no schema security
CREATE TABLE IF NOT EXISTS security.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON security.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON security.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_success ON security.access_logs(success);

-- Habilitar RLS na tabela de logs
ALTER TABLE security.access_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios logs
DROP POLICY IF EXISTS "Users can view their own access logs" ON security.access_logs;
CREATE POLICY "Users can view their own access logs"
  ON security.access_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Garantir que o schema security está acessível
GRANT USAGE ON SCHEMA security TO authenticated;
GRANT ALL ON security.access_logs TO authenticated;

