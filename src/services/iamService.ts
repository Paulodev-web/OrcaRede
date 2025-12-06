import { supabase } from '../lib/supabaseClient';
import type {
  Role,
  Permission,
  UserRole,
  UserProfile,
  RoleWithPermissions,
  UserWithRoles,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  UpdateUserProfileInput,
  UserRoleDetail,
} from '../types';

/**
 * Serviço de Identity and Access Management (IAM)
 * Gerencia roles, permissions, user roles e profiles
 */
export class IAMService {
  // ===============================================
  // ROLES
  // ===============================================

  /**
   * Busca todos os roles
   */
  static async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca um role por ID com suas permissões
   */
  static async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permission_id,
          permissions (*)
        )
      `)
      .eq('id', roleId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      permissions: data.role_permissions?.map((rp: any) => rp.permissions) || [],
    };
  }

  /**
   * Cria um novo role
   */
  static async createRole(input: CreateRoleInput): Promise<Role> {
    const { permission_ids, ...roleData } = input;

    // Criar o role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        ...roleData,
        is_system: false,
      })
      .select()
      .single();

    if (roleError) throw roleError;

    // Associar permissões se fornecidas
    if (permission_ids && permission_ids.length > 0) {
      const rolePermissions = permission_ids.map((permId) => ({
        role_id: role.id,
        permission_id: permId,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return role;
  }

  /**
   * Atualiza um role
   */
  static async updateRole(roleId: string, input: UpdateRoleInput): Promise<Role> {
    const { permission_ids, ...roleData } = input;

    // Atualizar o role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .update(roleData)
      .eq('id', roleId)
      .select()
      .single();

    if (roleError) throw roleError;

    // Atualizar permissões se fornecidas
    if (permission_ids !== undefined) {
      // Remover permissões antigas
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Adicionar novas permissões
      if (permission_ids.length > 0) {
        const rolePermissions = permission_ids.map((permId) => ({
          role_id: roleId,
          permission_id: permId,
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }
    }

    return role;
  }

  /**
   * Deleta um role (apenas se não for do sistema)
   */
  static async deleteRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('is_system', false); // Só permite deletar roles não-sistema

    if (error) throw error;
  }

  // ===============================================
  // PERMISSIONS
  // ===============================================

  /**
   * Busca todas as permissões
   */
  static async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource, action');

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca permissões agrupadas por recurso
   */
  static async getPermissionsGroupedByResource(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  /**
   * Busca permissões de um role específico
   */
  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions (*)
      `)
      .eq('role_id', roleId);

    if (error) throw error;
    return data?.map((rp: any) => rp.permissions) || [];
  }

  // ===============================================
  // USER ROLES
  // ===============================================

  /**
   * Busca roles de um usuário
   */
  static async getUserRoles(userId: string): Promise<UserRoleDetail[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles (*),
        assigned_by:assigned_by (
          id,
          email
        )
      `)
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca permissões de um usuário (através dos seus roles)
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      user_id_param: userId,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Verifica se usuário tem uma permissão específica
   */
  static async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_permission', {
      user_id_param: userId,
      permission_name_param: permissionName,
    });

    if (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
    return data || false;
  }

  /**
   * Verifica se usuário tem um role específico
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_role', {
      user_id_param: userId,
      role_name_param: roleName,
    });

    if (error) {
      console.error('Erro ao verificar role:', error);
      return false;
    }
    return data || false;
  }

  /**
   * Atribui um role a um usuário
   */
  static async assignRoleToUser(input: AssignRoleInput): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: input.user_id,
        role_id: input.role_id,
        expires_at: input.expires_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove um role de um usuário
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;
  }

  /**
   * Atualiza roles de um usuário (substitui todos os roles)
   */
  static async updateUserRoles(userId: string, roleIds: string[]): Promise<void> {
    // Remove todos os roles atuais
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Adiciona novos roles
    if (roleIds.length > 0) {
      const userRoles = roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
      }));

      const { error } = await supabase
        .from('user_roles')
        .insert(userRoles);

      if (error) throw error;
    }
  }

  // ===============================================
  // USER PROFILES
  // ===============================================

  /**
   * Busca perfil de um usuário
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }
    return data;
  }

  /**
   * Cria ou atualiza perfil de usuário
   */
  static async upsertUserProfile(
    userId: string,
    input: UpdateUserProfileInput
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza último login do usuário
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        last_login: new Date().toISOString(),
      });

    if (error) console.error('Erro ao atualizar último login:', error);
  }

  // ===============================================
  // USUÁRIOS (LISTAGEM COMPLETA)
  // ===============================================

  /**
   * Busca todos os usuários com seus roles e permissões
   */
  static async getAllUsers(): Promise<UserWithRoles[]> {
    // Buscar todos os usuários autenticados
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    // Para cada usuário, buscar profile, roles e permissões
    const usersWithData = await Promise.all(
      authUsers.users.map(async (user) => {
        const [profile, roles, permissions] = await Promise.all([
          this.getUserProfile(user.id),
          this.getUserRoles(user.id).then((userRoles) =>
            userRoles.map((ur) => ur.role).filter(Boolean) as Role[]
          ),
          this.getUserPermissions(user.id),
        ]);

        return {
          id: user.id,
          email: user.email || '',
          profile: profile || undefined,
          roles,
          permissions,
        };
      })
    );

    return usersWithData;
  }

  /**
   * Busca um usuário completo por ID
   */
  static async getUserById(userId: string): Promise<UserWithRoles | null> {
    // Buscar dados do usuário
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) throw authError;
    if (!authUser.user) return null;

    // Buscar profile, roles e permissões
    const [profile, roles, permissions] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserRoles(userId).then((userRoles) =>
        userRoles.map((ur) => ur.role).filter(Boolean) as Role[]
      ),
      this.getUserPermissions(userId),
    ]);

    return {
      id: authUser.user.id,
      email: authUser.user.email || '',
      profile: profile || undefined,
      roles,
      permissions,
    };
  }

  /**
   * Cria um novo usuário com role inicial
   */
  static async createUser(
    email: string,
    password: string,
    profile: UpdateUserProfileInput,
    roleIds: string[] = []
  ): Promise<UserWithRoles> {
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário');

    const userId = authData.user.id;

    // Criar perfil
    await this.upsertUserProfile(userId, {
      ...profile,
      is_active: true,
    });

    // Atribuir roles
    if (roleIds.length > 0) {
      await this.updateUserRoles(userId, roleIds);
    }

    // Retornar usuário completo
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Erro ao buscar usuário criado');

    return user;
  }

  /**
   * Atualiza um usuário existente
   */
  static async updateUser(
    userId: string,
    profile: UpdateUserProfileInput,
    roleIds?: string[]
  ): Promise<UserWithRoles> {
    // Atualizar perfil
    await this.upsertUserProfile(userId, profile);

    // Atualizar roles se fornecidos
    if (roleIds !== undefined) {
      await this.updateUserRoles(userId, roleIds);
    }

    // Retornar usuário atualizado
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Erro ao buscar usuário atualizado');

    return user;
  }

  /**
   * Desativa um usuário
   */
  static async deactivateUser(userId: string): Promise<void> {
    await this.upsertUserProfile(userId, {
      is_active: false,
    });
  }

  /**
   * Ativa um usuário
   */
  static async activateUser(userId: string): Promise<void> {
    await this.upsertUserProfile(userId, {
      is_active: true,
    });
  }

  /**
   * Deleta um usuário (soft delete - apenas desativa)
   */
  static async deleteUser(userId: string): Promise<void> {
    await this.deactivateUser(userId);
    // Nota: Não deletamos do auth.users para manter histórico
    // Se quiser hard delete, descomente a linha abaixo:
    // await supabase.auth.admin.deleteUser(userId);
  }

  // ===============================================
  // UTILITÁRIOS
  // ===============================================

  /**
   * Busca permissões necessárias para uma ação em um recurso
   */
  static getRequiredPermission(resource: string, action: string): string {
    return `${resource}.${action}`;
  }

  /**
   * Verifica múltiplas permissões de uma vez
   */
  static async hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const results = await Promise.all(
      permissionNames.map((name) => this.hasPermission(userId, name))
    );
    return results.some((result) => result);
  }

  /**
   * Verifica se tem todas as permissões
   */
  static async hasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    const results = await Promise.all(
      permissionNames.map((name) => this.hasPermission(userId, name))
    );
    return results.every((result) => result);
  }
}

export default IAMService;

