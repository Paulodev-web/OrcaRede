-- ===============================================
-- MIGRATION: Identity and Access Management (IAM)
-- Data: 2024-12-06
-- Descrição: Sistema completo de IAM com roles, permissions e RBAC
-- ===============================================

-- ===============================================
-- PARTE 1: CRIAR TABELAS DE IAM
-- ===============================================

-- 1. Tabela de Roles (Papéis)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- Roles do sistema não podem ser deletados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Permissions (Permissões)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- ex: budgets, materials, users
  action VARCHAR(50) NOT NULL, -- ex: create, read, update, delete, manage
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Associação Role-Permission (muitos para muitos)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 4. Tabela de User Roles (Associação Usuário-Role)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Opcional: roles temporários
  UNIQUE(user_id, role_id)
);

-- 5. Tabela de User Metadata (Informações extras do usuário)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- PARTE 2: CRIAR ÍNDICES
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- ===============================================
-- PARTE 3: INSERIR ROLES PADRÃO DO SISTEMA
-- ===============================================

INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Administrador', 'Acesso total ao sistema, incluindo gerenciamento de usuários e permissões', true),
  ('admin', 'Administrador', 'Acesso administrativo com permissões de gerenciamento', true),
  ('manager', 'Gerente', 'Acesso gerencial com permissões de aprovação e supervisão', true),
  ('editor', 'Editor', 'Pode criar e editar orçamentos e dados', true),
  ('viewer', 'Visualizador', 'Apenas visualização de dados, sem edição', true)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- PARTE 4: INSERIR PERMISSIONS PADRÃO DO SISTEMA
-- ===============================================

-- Permissões de Orçamentos (Budgets)
INSERT INTO permissions (name, display_name, description, resource, action, is_system) VALUES
  ('budgets.create', 'Criar Orçamentos', 'Permite criar novos orçamentos', 'budgets', 'create', true),
  ('budgets.read', 'Visualizar Orçamentos', 'Permite visualizar orçamentos', 'budgets', 'read', true),
  ('budgets.update', 'Editar Orçamentos', 'Permite editar orçamentos existentes', 'budgets', 'update', true),
  ('budgets.delete', 'Excluir Orçamentos', 'Permite excluir orçamentos', 'budgets', 'delete', true),
  ('budgets.manage', 'Gerenciar Orçamentos', 'Acesso total a orçamentos', 'budgets', 'manage', true),
  
  -- Permissões de Materiais
  ('materials.create', 'Criar Materiais', 'Permite criar novos materiais', 'materials', 'create', true),
  ('materials.read', 'Visualizar Materiais', 'Permite visualizar materiais', 'materials', 'read', true),
  ('materials.update', 'Editar Materiais', 'Permite editar materiais existentes', 'materials', 'update', true),
  ('materials.delete', 'Excluir Materiais', 'Permite excluir materiais', 'materials', 'delete', true),
  ('materials.manage', 'Gerenciar Materiais', 'Acesso total a materiais', 'materials', 'manage', true),
  
  -- Permissões de Concessionárias
  ('companies.create', 'Criar Concessionárias', 'Permite criar novas concessionárias', 'companies', 'create', true),
  ('companies.read', 'Visualizar Concessionárias', 'Permite visualizar concessionárias', 'companies', 'read', true),
  ('companies.update', 'Editar Concessionárias', 'Permite editar concessionárias', 'companies', 'update', true),
  ('companies.delete', 'Excluir Concessionárias', 'Permite excluir concessionárias', 'companies', 'delete', true),
  ('companies.manage', 'Gerenciar Concessionárias', 'Acesso total a concessionárias', 'companies', 'manage', true),
  
  -- Permissões de Grupos de Itens
  ('groups.create', 'Criar Grupos', 'Permite criar grupos de itens', 'groups', 'create', true),
  ('groups.read', 'Visualizar Grupos', 'Permite visualizar grupos', 'groups', 'read', true),
  ('groups.update', 'Editar Grupos', 'Permite editar grupos', 'groups', 'update', true),
  ('groups.delete', 'Excluir Grupos', 'Permite excluir grupos', 'groups', 'delete', true),
  ('groups.manage', 'Gerenciar Grupos', 'Acesso total a grupos', 'groups', 'manage', true),
  
  -- Permissões de Tipos de Poste
  ('post_types.create', 'Criar Tipos de Poste', 'Permite criar tipos de poste', 'post_types', 'create', true),
  ('post_types.read', 'Visualizar Tipos de Poste', 'Permite visualizar tipos de poste', 'post_types', 'read', true),
  ('post_types.update', 'Editar Tipos de Poste', 'Permite editar tipos de poste', 'post_types', 'update', true),
  ('post_types.delete', 'Excluir Tipos de Poste', 'Permite excluir tipos de poste', 'post_types', 'delete', true),
  ('post_types.manage', 'Gerenciar Tipos de Poste', 'Acesso total a tipos de poste', 'post_types', 'manage', true),
  
  -- Permissões de Usuários
  ('users.create', 'Criar Usuários', 'Permite criar novos usuários', 'users', 'create', true),
  ('users.read', 'Visualizar Usuários', 'Permite visualizar usuários', 'users', 'read', true),
  ('users.update', 'Editar Usuários', 'Permite editar usuários', 'users', 'update', true),
  ('users.delete', 'Excluir Usuários', 'Permite excluir usuários', 'users', 'delete', true),
  ('users.manage', 'Gerenciar Usuários', 'Acesso total a usuários', 'users', 'manage', true),
  
  -- Permissões de Roles e Permissões (IAM)
  ('roles.create', 'Criar Roles', 'Permite criar novos roles', 'roles', 'create', true),
  ('roles.read', 'Visualizar Roles', 'Permite visualizar roles', 'roles', 'read', true),
  ('roles.update', 'Editar Roles', 'Permite editar roles', 'roles', 'update', true),
  ('roles.delete', 'Excluir Roles', 'Permite excluir roles', 'roles', 'delete', true),
  ('roles.manage', 'Gerenciar Roles', 'Acesso total a roles', 'roles', 'manage', true),
  
  -- Permissões de Relatórios e Exports
  ('reports.generate', 'Gerar Relatórios', 'Permite gerar relatórios', 'reports', 'generate', true),
  ('reports.export', 'Exportar Dados', 'Permite exportar dados', 'reports', 'export', true),
  
  -- Permissões de Configurações
  ('settings.read', 'Visualizar Configurações', 'Permite visualizar configurações', 'settings', 'read', true),
  ('settings.update', 'Editar Configurações', 'Permite editar configurações', 'settings', 'update', true),
  ('settings.manage', 'Gerenciar Configurações', 'Acesso total a configurações', 'settings', 'manage', true)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- PARTE 5: ASSOCIAR PERMISSIONS AOS ROLES PADRÃO
-- ===============================================

-- Super Admin: Todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin: Todas as permissões exceto gerenciamento de roles do sistema
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name != 'roles.manage'
ON CONFLICT DO NOTHING;

-- Manager: Permissões de gerenciamento e criação
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.action IN ('create', 'read', 'update', 'manage')
  AND p.resource IN ('budgets', 'materials', 'companies', 'groups', 'post_types', 'reports')
ON CONFLICT DO NOTHING;

-- Editor: Permissões de CRUD (sem manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'editor'
  AND p.action IN ('create', 'read', 'update', 'delete')
  AND p.resource IN ('budgets', 'materials', 'groups', 'post_types')
ON CONFLICT DO NOTHING;

-- Viewer: Apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- ===============================================
-- PARTE 6: HABILITAR ROW LEVEL SECURITY
-- ===============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PARTE 7: CRIAR POLÍTICAS RLS
-- ===============================================

-- Roles: Apenas admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
        AND p.name = 'roles.manage'
    )
  );

-- Todos podem visualizar roles
DROP POLICY IF EXISTS "Everyone can view roles" ON roles;
CREATE POLICY "Everyone can view roles"
  ON roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Permissions: Apenas admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
CREATE POLICY "Admins can manage permissions"
  ON permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
        AND p.name = 'roles.manage'
    )
  );

-- Todos podem visualizar permissions
DROP POLICY IF EXISTS "Everyone can view permissions" ON permissions;
CREATE POLICY "Everyone can view permissions"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Role Permissions: Apenas admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
        AND p.name = 'roles.manage'
    )
  );

-- Todos podem visualizar role permissions
DROP POLICY IF EXISTS "Everyone can view role permissions" ON role_permissions;
CREATE POLICY "Everyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- User Roles: Apenas admins podem gerenciar roles de usuários
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
        AND p.name = 'users.manage'
    )
  );

-- Usuários podem ver seus próprios roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- User Profiles: Usuários podem ver e editar seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins podem ver e gerenciar todos os perfis
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
        AND p.name = 'users.manage'
    )
  );

-- ===============================================
-- PARTE 8: CRIAR FUNÇÕES AUXILIARES
-- ===============================================

-- Função para verificar se usuário tem uma permissão específica
CREATE OR REPLACE FUNCTION has_permission(user_id_param UUID, permission_name_param VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_id_param
      AND p.name = permission_name_param
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem um role específico
CREATE OR REPLACE FUNCTION has_role(user_id_param UUID, role_name_param VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
      AND r.name = role_name_param
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS TABLE (
  permission_id UUID,
  permission_name VARCHAR,
  permission_display_name VARCHAR,
  resource VARCHAR,
  action VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.display_name,
    p.resource,
    p.action
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = user_id_param
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todos os roles de um usuário
CREATE OR REPLACE FUNCTION get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_id UUID,
  role_name VARCHAR,
  role_display_name VARCHAR,
  assigned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.display_name,
    ur.assigned_at,
    ur.expires_at
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atribuir role a usuário
CREATE OR REPLACE FUNCTION assign_role_to_user(
  target_user_id UUID,
  role_name_param VARCHAR,
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  role_id_var UUID;
BEGIN
  -- Verificar se o usuário atual tem permissão
  IF NOT has_permission(auth.uid(), 'users.manage') THEN
    RAISE EXCEPTION 'Usuário não tem permissão para atribuir roles';
  END IF;
  
  -- Buscar o role
  SELECT id INTO role_id_var
  FROM roles
  WHERE name = role_name_param;
  
  IF role_id_var IS NULL THEN
    RAISE EXCEPTION 'Role não encontrado: %', role_name_param;
  END IF;
  
  -- Inserir ou atualizar user_role
  INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
  VALUES (target_user_id, role_id_var, auth.uid(), expires_at_param)
  ON CONFLICT (user_id, role_id)
  DO UPDATE SET
    assigned_by = auth.uid(),
    assigned_at = NOW(),
    expires_at = expires_at_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover role de usuário
CREATE OR REPLACE FUNCTION remove_role_from_user(
  target_user_id UUID,
  role_name_param VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  role_id_var UUID;
BEGIN
  -- Verificar se o usuário atual tem permissão
  IF NOT has_permission(auth.uid(), 'users.manage') THEN
    RAISE EXCEPTION 'Usuário não tem permissão para remover roles';
  END IF;
  
  -- Buscar o role
  SELECT id INTO role_id_var
  FROM roles
  WHERE name = role_name_param;
  
  IF role_id_var IS NULL THEN
    RAISE EXCEPTION 'Role não encontrado: %', role_name_param;
  END IF;
  
  -- Deletar user_role
  DELETE FROM user_roles
  WHERE user_id = target_user_id
    AND role_id = role_id_var;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em roles
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- PARTE 9: CRIAR VIEW PARA FACILITAR CONSULTAS
-- ===============================================

-- View para ver usuários com seus roles e permissões
CREATE OR REPLACE VIEW user_access_view AS
SELECT DISTINCT
  u.id AS user_id,
  u.email,
  up.full_name,
  up.is_active,
  r.id AS role_id,
  r.name AS role_name,
  r.display_name AS role_display_name,
  p.id AS permission_id,
  p.name AS permission_name,
  p.resource,
  p.action
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- ===============================================
-- PARTE 10: COMENTÁRIOS
-- ===============================================

COMMENT ON TABLE roles IS 'Tabela de roles (papéis) do sistema';
COMMENT ON TABLE permissions IS 'Tabela de permissões granulares';
COMMENT ON TABLE role_permissions IS 'Associação entre roles e permissões (RBAC)';
COMMENT ON TABLE user_roles IS 'Roles atribuídos aos usuários';
COMMENT ON TABLE user_profiles IS 'Perfis e metadados dos usuários';

COMMENT ON FUNCTION has_permission IS 'Verifica se um usuário tem uma permissão específica';
COMMENT ON FUNCTION has_role IS 'Verifica se um usuário tem um role específico';
COMMENT ON FUNCTION get_user_permissions IS 'Retorna todas as permissões de um usuário';
COMMENT ON FUNCTION get_user_roles IS 'Retorna todos os roles de um usuário';
COMMENT ON FUNCTION assign_role_to_user IS 'Atribui um role a um usuário';
COMMENT ON FUNCTION remove_role_from_user IS 'Remove um role de um usuário';

-- ===============================================
-- FIM DA MIGRATION
-- ===============================================

