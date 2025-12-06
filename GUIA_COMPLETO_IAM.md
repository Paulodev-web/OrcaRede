# Guia Completo do Sistema IAM (Identity and Access Management)

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Roles e Permissões Padrão](#roles-e-permissões-padrão)
5. [Uso no Frontend](#uso-no-frontend)
6. [API e Serviços](#api-e-serviços)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Configuração Inicial](#configuração-inicial)
9. [Guia de Administração](#guia-de-administração)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema IAM do OrcaRedes é uma solução completa de gerenciamento de identidade e acesso baseado em **Role-Based Access Control (RBAC)**. Ele permite:

- ✅ Controle granular de acesso a recursos
- ✅ Gerenciamento de usuários, roles e permissões
- ✅ Proteção de rotas e componentes no frontend
- ✅ Row Level Security (RLS) no Supabase
- ✅ Interface administrativa completa
- ✅ Auditoria de acessos e ações

### Conceitos Principais

- **User (Usuário)**: Pessoa que usa o sistema
- **Role (Papel)**: Conjunto de permissões (ex: Admin, Editor, Viewer)
- **Permission (Permissão)**: Ação específica em um recurso (ex: `budgets.create`)
- **Resource (Recurso)**: Entidade do sistema (ex: budgets, materials, users)
- **Action (Ação)**: Operação sobre um recurso (ex: create, read, update, delete, manage)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  Components                                                  │
│  ├── GerenciarUsuarios.tsx  (Gerenciar usuários)           │
│  ├── GerenciarRoles.tsx     (Gerenciar roles)              │
│  └── Can / Cannot           (Guards de permissão)           │
├─────────────────────────────────────────────────────────────┤
│  Hooks                                                       │
│  └── usePermissions()       (Hook de verificação)           │
├─────────────────────────────────────────────────────────────┤
│  Contexts                                                    │
│  └── AuthContext            (Estado de auth + IAM)          │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  └── IAMService             (API calls)                     │
├─────────────────────────────────────────────────────────────┤
│  Types                                                       │
│  └── Role, Permission, UserProfile, etc.                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
├─────────────────────────────────────────────────────────────┤
│  Database Tables                                             │
│  ├── roles                                                   │
│  ├── permissions                                             │
│  ├── role_permissions                                        │
│  ├── user_roles                                              │
│  └── user_profiles                                           │
├─────────────────────────────────────────────────────────────┤
│  Row Level Security (RLS)                                    │
│  └── Políticas automáticas por tabela                       │
├─────────────────────────────────────────────────────────────┤
│  Functions                                                   │
│  ├── has_permission()                                        │
│  ├── has_role()                                              │
│  ├── get_user_permissions()                                 │
│  ├── get_user_roles()                                        │
│  ├── assign_role_to_user()                                  │
│  └── remove_role_from_user()                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `roles`

Armazena os papéis/funções do sistema.

| Coluna        | Tipo      | Descrição                                    |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | Chave primária                               |
| name          | VARCHAR   | Identificador único (snake_case)             |
| display_name  | VARCHAR   | Nome para exibição                           |
| description   | TEXT      | Descrição do role                            |
| is_system     | BOOLEAN   | Se é role do sistema (não pode deletar)     |
| created_at    | TIMESTAMP | Data de criação                              |
| updated_at    | TIMESTAMP | Data de atualização                          |

### Tabela: `permissions`

Armazena as permissões granulares.

| Coluna        | Tipo      | Descrição                                    |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | Chave primária                               |
| name          | VARCHAR   | Identificador único (resource.action)        |
| display_name  | VARCHAR   | Nome para exibição                           |
| description   | TEXT      | Descrição da permissão                       |
| resource      | VARCHAR   | Recurso (budgets, materials, etc.)           |
| action        | VARCHAR   | Ação (create, read, update, delete, manage)  |
| is_system     | BOOLEAN   | Se é permissão do sistema                    |
| created_at    | TIMESTAMP | Data de criação                              |

### Tabela: `role_permissions`

Associação N:N entre roles e permissions.

| Coluna        | Tipo      | Descrição                                    |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | Chave primária                               |
| role_id       | UUID      | FK para roles                                |
| permission_id | UUID      | FK para permissions                          |
| created_at    | TIMESTAMP | Data de criação                              |

### Tabela: `user_roles`

Associação entre usuários e roles.

| Coluna        | Tipo      | Descrição                                    |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | Chave primária                               |
| user_id       | UUID      | FK para auth.users                           |
| role_id       | UUID      | FK para roles                                |
| assigned_by   | UUID      | FK para auth.users (quem atribuiu)           |
| assigned_at   | TIMESTAMP | Data de atribuição                           |
| expires_at    | TIMESTAMP | Data de expiração (opcional)                 |

### Tabela: `user_profiles`

Metadados dos usuários.

| Coluna        | Tipo      | Descrição                                    |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | FK para auth.users (PK)                      |
| full_name     | VARCHAR   | Nome completo                                |
| email         | VARCHAR   | Email                                        |
| phone         | VARCHAR   | Telefone                                     |
| department    | VARCHAR   | Departamento                                 |
| position      | VARCHAR   | Cargo                                        |
| is_active     | BOOLEAN   | Status ativo/inativo                         |
| last_login    | TIMESTAMP | Último login                                 |
| created_at    | TIMESTAMP | Data de criação                              |
| updated_at    | TIMESTAMP | Data de atualização                          |

---

## 🎭 Roles e Permissões Padrão

### Roles do Sistema

#### 1. **Super Admin** (`super_admin`)
- **Descrição**: Acesso total ao sistema, incluindo gerenciamento de IAM
- **Permissões**: TODAS
- **Uso**: Administrador principal do sistema

#### 2. **Admin** (`admin`)
- **Descrição**: Acesso administrativo, sem gerenciar roles do sistema
- **Permissões**: Todas exceto `roles.manage`
- **Uso**: Administradores secundários

#### 3. **Manager** (`manager`)
- **Descrição**: Acesso gerencial com permissões de aprovação
- **Permissões**: create, read, update, manage em budgets, materials, companies, groups, post_types
- **Uso**: Gerentes de projeto

#### 4. **Editor** (`editor`)
- **Descrição**: Pode criar e editar dados
- **Permissões**: create, read, update, delete em budgets, materials, groups, post_types
- **Uso**: Usuários que criam orçamentos

#### 5. **Viewer** (`viewer`)
- **Descrição**: Apenas visualização
- **Permissões**: read em todos os recursos
- **Uso**: Visualização de relatórios

### Recursos e Ações

| Recurso      | Ações Disponíveis                              |
|--------------|------------------------------------------------|
| budgets      | create, read, update, delete, manage           |
| materials    | create, read, update, delete, manage           |
| companies    | create, read, update, delete, manage           |
| groups       | create, read, update, delete, manage           |
| post_types   | create, read, update, delete, manage           |
| users        | create, read, update, delete, manage           |
| roles        | create, read, update, delete, manage           |
| reports      | generate, export                               |
| settings     | read, update, manage                           |

### Nomenclatura de Permissões

Formato: `{resource}.{action}`

Exemplos:
- `budgets.create` - Criar orçamentos
- `materials.read` - Visualizar materiais
- `users.manage` - Gerenciar usuários completamente
- `reports.export` - Exportar relatórios

---

## 💻 Uso no Frontend

### 1. Hook usePermissions

O hook principal para verificar permissões nos componentes.

```typescript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const {
    permissions,      // Lista de permissões do usuário
    roles,           // Lista de roles do usuário
    loading,         // Estado de carregamento
    hasPermission,   // (name: string) => boolean
    hasAnyPermission,// (names: string[]) => boolean
    hasAllPermissions,// (names: string[]) => boolean
    hasRole,         // (name: string) => boolean
    can,             // (resource: string, action: string) => boolean
    cannot,          // (resource: string, action: string) => boolean
    isAdmin,         // () => boolean
    isSuperAdmin,    // () => boolean
    refresh,         // () => Promise<void>
  } = usePermissions();

  // Exemplos de uso
  if (loading) return <div>Carregando...</div>;
  
  if (can('budgets', 'create')) {
    return <button>Criar Orçamento</button>;
  }

  if (isAdmin()) {
    return <AdminPanel />;
  }

  return null;
}
```

### 2. Componente Can

Componente para renderização condicional baseada em permissões.

```tsx
import { Can } from '../hooks/usePermissions';

// Permissão única
<Can permission="budgets.create">
  <button>Criar Orçamento</button>
</Can>

// Múltiplas permissões (qualquer uma)
<Can permissions={['budgets.update', 'budgets.manage']}>
  <button>Editar</button>
</Can>

// Múltiplas permissões (todas obrigatórias)
<Can permissions={['budgets.delete', 'budgets.manage']} requireAll>
  <button>Excluir</button>
</Can>

// Por role
<Can role="admin">
  <AdminSection />
</Can>

// Por recurso + ação
<Can resource="materials" action="create">
  <button>Novo Material</button>
</Can>

// Com fallback
<Can 
  permission="users.read"
  fallback={<div>Você não tem acesso</div>}
>
  <UsersList />
</Can>
```

### 3. Componente Cannot

Inverso do Can - mostra apenas se NÃO tiver permissão.

```tsx
import { Cannot } from '../hooks/usePermissions';

<Cannot permission="budgets.delete">
  <p>Você não pode deletar orçamentos</p>
</Cannot>
```

### 4. AuthContext com IAM

O AuthContext foi estendido com funcionalidades IAM.

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const {
    user,              // Usuário do Supabase Auth
    userProfile,       // Perfil do usuário (user_profiles)
    roles,             // Roles do usuário
    permissions,       // Permissões do usuário
    loading,           // Estado de carregamento
    hasPermission,     // (name: string) => boolean
    hasRole,           // (name: string) => boolean
    can,               // (resource: string, action: string) => boolean
    isAdmin,           // () => boolean
    refreshUserData,   // () => Promise<void>
    signOut,           // () => Promise<void>
  } = useAuth();

  return (
    <div>
      <p>Olá, {userProfile?.full_name || user?.email}</p>
      {isAdmin() && <p>Você é administrador</p>}
    </div>
  );
}
```

---

## 🔧 API e Serviços

### IAMService

Serviço principal para todas as operações de IAM.

```typescript
import { IAMService } from '../services/iamService';

// ===== ROLES =====

// Buscar todos os roles
const roles = await IAMService.getRoles();

// Buscar role por ID com permissões
const role = await IAMService.getRoleById(roleId);

// Criar role
const newRole = await IAMService.createRole({
  name: 'gerente_vendas',
  display_name: 'Gerente de Vendas',
  description: 'Gerencia equipe de vendas',
  permission_ids: ['perm-id-1', 'perm-id-2']
});

// Atualizar role
const updatedRole = await IAMService.updateRole(roleId, {
  display_name: 'Novo Nome',
  description: 'Nova descrição',
  permission_ids: ['perm-id-1', 'perm-id-3']
});

// Deletar role (apenas não-sistema)
await IAMService.deleteRole(roleId);

// ===== PERMISSIONS =====

// Buscar todas as permissões
const permissions = await IAMService.getPermissions();

// Buscar permissões agrupadas por recurso
const grouped = await IAMService.getPermissionsGroupedByResource();
// Retorna: { budgets: [...], materials: [...], ... }

// Buscar permissões de um role
const rolePerms = await IAMService.getRolePermissions(roleId);

// ===== USER ROLES =====

// Buscar roles de um usuário
const userRoles = await IAMService.getUserRoles(userId);

// Buscar permissões de um usuário
const userPerms = await IAMService.getUserPermissions(userId);

// Verificar se usuário tem permissão
const has = await IAMService.hasPermission(userId, 'budgets.create');

// Verificar se usuário tem role
const hasRole = await IAMService.hasRole(userId, 'admin');

// Atribuir role a usuário
await IAMService.assignRoleToUser({
  user_id: userId,
  role_id: roleId,
  expires_at: '2024-12-31T23:59:59Z' // Opcional
});

// Remover role de usuário
await IAMService.removeRoleFromUser(userId, roleId);

// Atualizar todos os roles de um usuário
await IAMService.updateUserRoles(userId, [roleId1, roleId2]);

// ===== USER PROFILES =====

// Buscar perfil de usuário
const profile = await IAMService.getUserProfile(userId);

// Criar ou atualizar perfil
const updatedProfile = await IAMService.upsertUserProfile(userId, {
  full_name: 'João Silva',
  phone: '(11) 99999-9999',
  department: 'TI',
  position: 'Desenvolvedor',
  is_active: true
});

// Atualizar último login
await IAMService.updateLastLogin(userId);

// ===== USUÁRIOS COMPLETOS =====

// Buscar todos os usuários com roles e permissões
const users = await IAMService.getAllUsers();

// Buscar usuário completo por ID
const user = await IAMService.getUserById(userId);

// Criar novo usuário
const newUser = await IAMService.createUser(
  'usuario@email.com',
  'senha123',
  {
    full_name: 'Nome do Usuário',
    department: 'Vendas',
    position: 'Vendedor'
  },
  [roleId1, roleId2] // Roles iniciais
);

// Atualizar usuário
const updatedUser = await IAMService.updateUser(
  userId,
  {
    full_name: 'Novo Nome',
    is_active: true
  },
  [roleId1] // Novos roles (opcional)
);

// Desativar usuário
await IAMService.deactivateUser(userId);

// Ativar usuário
await IAMService.activateUser(userId);

// Deletar usuário (soft delete)
await IAMService.deleteUser(userId);

// ===== UTILITÁRIOS =====

// Gerar nome de permissão
const permName = IAMService.getRequiredPermission('budgets', 'create');
// Retorna: 'budgets.create'

// Verificar se tem qualquer permissão
const hasAny = await IAMService.hasAnyPermission(userId, [
  'budgets.create',
  'budgets.manage'
]);

// Verificar se tem todas as permissões
const hasAll = await IAMService.hasAllPermissions(userId, [
  'budgets.read',
  'budgets.update'
]);
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Proteger um Botão

```tsx
import { Can } from '../hooks/usePermissions';

function BudgetsList() {
  return (
    <div>
      <h1>Orçamentos</h1>
      
      <Can permission="budgets.create">
        <button onClick={handleCreate}>
          Criar Novo Orçamento
        </button>
      </Can>
      
      {/* Lista de orçamentos */}
    </div>
  );
}
```

### Exemplo 2: Proteger uma Rota/View

```tsx
import { Can } from '../hooks/usePermissions';

function App() {
  const { currentView, setCurrentView } = useApp();
  
  if (currentView === 'usuarios') {
    return (
      <Can 
        permission="users.manage"
        fallback={
          <div>
            <h2>Acesso Negado</h2>
            <p>Você não tem permissão para acessar esta página</p>
            <button onClick={() => setCurrentView('dashboard')}>
              Voltar ao Dashboard
            </button>
          </div>
        }
      >
        <GerenciarUsuarios />
      </Can>
    );
  }
  
  // ... outras views
}
```

### Exemplo 3: Verificação Programática

```tsx
import { usePermissions } from '../hooks/usePermissions';

function BudgetCard({ budget }) {
  const { can, cannot } = usePermissions();
  
  const handleDelete = () => {
    if (cannot('budgets', 'delete')) {
      alert('Você não tem permissão para deletar orçamentos');
      return;
    }
    
    // Prosseguir com deleção
  };
  
  return (
    <div>
      <h3>{budget.name}</h3>
      {can('budgets', 'update') && (
        <button onClick={handleEdit}>Editar</button>
      )}
      {can('budgets', 'delete') && (
        <button onClick={handleDelete}>Excluir</button>
      )}
    </div>
  );
}
```

### Exemplo 4: Menu Condicional na Sidebar

```tsx
import { Can } from '../hooks/usePermissions';

function Sidebar() {
  return (
    <nav>
      {/* Items visíveis para todos */}
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/budgets">Orçamentos</NavItem>
      
      {/* Seção de Configurações - apenas quem pode ver materiais */}
      <Can permissions={['materials.read', 'materials.manage']}>
        <NavSection title="Configurações">
          <NavItem to="/materials">Materiais</NavItem>
          <NavItem to="/companies">Concessionárias</NavItem>
        </NavSection>
      </Can>
      
      {/* Seção Admin - apenas administradores */}
      <Can permissions={['users.manage', 'roles.manage']}>
        <NavSection title="Administração">
          <Can permission="users.manage">
            <NavItem to="/users">Usuários</NavItem>
          </Can>
          <Can permission="roles.manage">
            <NavItem to="/roles">Roles</NavItem>
          </Can>
        </NavSection>
      </Can>
    </nav>
  );
}
```

### Exemplo 5: Criar Role Customizado

```tsx
import { IAMService } from '../services/iamService';

async function createCustomRole() {
  try {
    // 1. Buscar permissões necessárias
    const allPermissions = await IAMService.getPermissions();
    
    // 2. Filtrar permissões desejadas
    const budgetPerms = allPermissions.filter(p => 
      p.resource === 'budgets' && 
      ['read', 'create', 'update'].includes(p.action)
    );
    const reportPerms = allPermissions.filter(p => 
      p.resource === 'reports'
    );
    
    const selectedPermissions = [...budgetPerms, ...reportPerms];
    
    // 3. Criar o role
    const newRole = await IAMService.createRole({
      name: 'orcamentista',
      display_name: 'Orçamentista',
      description: 'Pode criar e editar orçamentos, e gerar relatórios',
      permission_ids: selectedPermissions.map(p => p.id)
    });
    
    console.log('Role criado:', newRole);
    
    // 4. Atribuir a um usuário
    await IAMService.assignRoleToUser({
      user_id: 'user-id-aqui',
      role_id: newRole.id
    });
    
    alert('Role criado e atribuído com sucesso!');
  } catch (error) {
    console.error('Erro ao criar role:', error);
    alert('Erro ao criar role');
  }
}
```

---

## ⚙️ Configuração Inicial

### 1. Aplicar Migração

```bash
# No Supabase Dashboard ou via CLI
supabase db push
```

Ou aplique manualmente o arquivo:
```
supabase/migrations/20251206000000_create_iam_system.sql
```

### 2. Criar Primeiro Super Admin

```sql
-- No SQL Editor do Supabase
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'SEU_USER_ID_AQUI', 
  id 
FROM roles 
WHERE name = 'super_admin';
```

Para descobrir seu user_id:
```sql
SELECT id, email FROM auth.users;
```

### 3. Verificar Instalação

```sql
-- Verificar roles criados
SELECT * FROM roles ORDER BY name;

-- Verificar permissões criadas
SELECT COUNT(*) as total, resource 
FROM permissions 
GROUP BY resource 
ORDER BY resource;

-- Verificar seu primeiro admin
SELECT 
  u.email,
  r.name as role_name,
  r.display_name
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id;
```

### 4. Testar no Frontend

1. Faça login com o usuário super admin
2. Navegue para "Gerenciar Usuários"
3. Crie um novo usuário de teste
4. Atribua roles diferentes
5. Teste as permissões

---

## 👨‍💼 Guia de Administração

### Gerenciar Usuários

#### Criar Novo Usuário

1. Acesse **Administração → Usuários**
2. Clique em **Novo Usuário**
3. Preencha:
   - Email *
   - Senha *
   - Nome Completo
   - Telefone
   - Departamento
   - Cargo
4. Selecione os **Roles** desejados
5. Clique em **Criar Usuário**

#### Editar Usuário

1. Na lista de usuários, clique no ícone de **Editar**
2. Modifique as informações
3. Altere os roles conforme necessário
4. Marque/desmarque **Usuário ativo**
5. Clique em **Salvar Alterações**

#### Desativar Usuário

1. Na lista de usuários, clique no ícone de **Desativar** (X vermelho)
2. Confirme a ação
3. O usuário não poderá mais fazer login

#### Filtrar Usuários

- **Por nome/email**: Use a barra de busca
- **Por role**: Selecione no filtro de roles
- **Por status**: Selecione Ativo/Inativo

### Gerenciar Roles

#### Criar Novo Role

1. Acesse **Administração → Roles e Permissões**
2. Clique em **Novo Role**
3. Preencha:
   - Nome Identificador * (snake_case)
   - Nome de Exibição *
   - Descrição
4. Selecione as **Permissões**:
   - Clique em cada recurso para expandir
   - Marque as permissões desejadas
   - Use "Marcar Todas" para selecionar todas de um recurso
5. Clique em **Criar Role**

#### Editar Role

1. Na lista de roles, clique no ícone de **Editar**
2. Modifique nome de exibição e descrição
3. Altere as permissões conforme necessário
4. Clique em **Salvar Alterações**

**Nota**: Roles do sistema (com badge "Sistema") têm restrições de edição.

#### Deletar Role

1. Na lista de roles, clique no ícone de **Excluir**
2. Confirme a ação

**Nota**: Roles do sistema não podem ser deletados.

#### Visualizar Permissões de um Role

1. Na lista de roles, clique no ícone de **Expandir** (chevron)
2. Veja todas as permissões agrupadas por recurso

### Melhores Práticas

1. **Princípio do Menor Privilégio**: Atribua apenas as permissões necessárias
2. **Use Roles, não Permissões Diretas**: Sempre atribua roles aos usuários
3. **Roles Descritivos**: Use nomes claros que indicam a função
4. **Revisão Periódica**: Revise roles e permissões regularmente
5. **Auditoria**: Monitore mudanças de roles e acessos
6. **Roles Temporários**: Use `expires_at` para acessos temporários
7. **Documentação**: Documente o propósito de cada role customizado

---

## 🐛 Troubleshooting

### Problema: Usuário não consegue acessar nada após login

**Possíveis Causas**:
1. Usuário não tem nenhum role atribuído
2. Profile do usuário está inativo
3. Erro ao carregar permissões

**Solução**:
```sql
-- Verificar roles do usuário
SELECT r.name, r.display_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = 'USER_ID';

-- Verificar se está ativo
SELECT is_active FROM user_profiles WHERE id = 'USER_ID';

-- Atribuir role básico
INSERT INTO user_roles (user_id, role_id)
SELECT 'USER_ID', id FROM roles WHERE name = 'viewer';
```

### Problema: Botão/Menu não aparece mesmo com permissão

**Possíveis Causas**:
1. Nome da permissão errado no código
2. Cache do AuthContext não atualizou
3. Componente Can não está carregando

**Solução**:
```typescript
// 1. Verificar nome correto da permissão
const { permissions } = usePermissions();
console.log('Permissões do usuário:', permissions.map(p => p.name));

// 2. Forçar refresh
const { refresh } = usePermissions();
await refresh();

// 3. Verificar se está carregando
const { loading } = usePermissions();
if (loading) return <div>Carregando...</div>;
```

### Problema: Erro ao criar usuário

**Erro**: "User with this email already exists"

**Solução**:
- Email já está cadastrado no sistema
- Use outro email ou recupere a conta existente

**Erro**: "Password should be at least 6 characters"

**Solução**:
- Use uma senha com pelo menos 6 caracteres
- Configure política de senha mais forte no Supabase

### Problema: RLS bloqueando operações

**Sintoma**: Queries não retornam dados mesmo com permissão

**Solução**:
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Testar como superuser (temporário)
-- Desabilitar RLS temporariamente para debug
ALTER TABLE tabela_problema DISABLE ROW LEVEL SECURITY;
-- Teste sua query
-- LEMBRE-SE DE REABILITAR!
ALTER TABLE tabela_problema ENABLE ROW LEVEL SECURITY;
```

### Problema: Performance lenta ao verificar permissões

**Sintoma**: usePermissions demora muito

**Solução**:
```typescript
// 1. Use cache do AuthContext ao invés de usePermissions
const { hasPermission, can } = useAuth(); // Já tem cache

// 2. Evite verificações em loops
// ❌ Ruim
items.map(item => (
  <Can permission="items.edit">
    <EditButton item={item} />
  </Can>
))

// ✅ Bom
const canEdit = hasPermission('items.edit');
items.map(item => (
  canEdit && <EditButton item={item} />
))
```

### Logs de Debug

```typescript
// Adicionar logs temporários
const { permissions, roles, loading } = usePermissions();

useEffect(() => {
  console.group('IAM Debug');
  console.log('Loading:', loading);
  console.log('Roles:', roles);
  console.log('Permissions:', permissions);
  console.log('Is Admin:', isAdmin());
  console.groupEnd();
}, [loading, roles, permissions]);
```

---

## 📚 Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [RBAC Pattern](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Princípio do Menor Privilégio](https://en.wikipedia.org/wiki/Principle_of_least_privilege)

---

## 📞 Suporte

Para questões sobre o sistema IAM:

1. Consulte este guia
2. Verifique os logs do browser (Console)
3. Verifique os logs do Supabase (Dashboard → Logs)
4. Revise o código fonte em `src/services/iamService.ts`

---

**Última Atualização**: 06 de Dezembro de 2024  
**Versão**: 1.0.0

