import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IAMService } from '../services/iamService';
import type { Permission, Role } from '../types';

/**
 * Hook para gerenciar permissões do usuário atual
 * Fornece métodos para verificar permissões e roles
 */
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carrega permissões e roles do usuário
  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadUserAccess() {
      try {
        setLoading(true);
        setError(null);

        const [userPermissions, userRoles] = await Promise.all([
          IAMService.getUserPermissions(user.id),
          IAMService.getUserRoles(user.id).then((userRoles) =>
            userRoles.map((ur) => ur.role).filter(Boolean) as Role[]
          ),
        ]);

        if (mounted) {
          setPermissions(userPermissions);
          setRoles(userRoles);
        }
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUserAccess();

    return () => {
      mounted = false;
    };
  }, [user]);

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param permissionName Nome da permissão (ex: 'budgets.create')
   */
  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      return permissions.some((p) => p.name === permissionName);
    },
    [permissions]
  );

  /**
   * Verifica se o usuário tem qualquer uma das permissões fornecidas
   * @param permissionNames Array de nomes de permissões
   */
  const hasAnyPermission = useCallback(
    (permissionNames: string[]): boolean => {
      return permissionNames.some((name) => hasPermission(name));
    },
    [hasPermission]
  );

  /**
   * Verifica se o usuário tem todas as permissões fornecidas
   * @param permissionNames Array de nomes de permissões
   */
  const hasAllPermissions = useCallback(
    (permissionNames: string[]): boolean => {
      return permissionNames.every((name) => hasPermission(name));
    },
    [hasPermission]
  );

  /**
   * Verifica se o usuário tem um role específico
   * @param roleName Nome do role (ex: 'admin')
   */
  const hasRole = useCallback(
    (roleName: string): boolean => {
      return roles.some((r) => r.name === roleName);
    },
    [roles]
  );

  /**
   * Verifica se o usuário tem qualquer um dos roles fornecidos
   * @param roleNames Array de nomes de roles
   */
  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      return roleNames.some((name) => hasRole(name));
    },
    [hasRole]
  );

  /**
   * Verifica se o usuário tem todos os roles fornecidos
   * @param roleNames Array de nomes de roles
   */
  const hasAllRoles = useCallback(
    (roleNames: string[]): boolean => {
      return roleNames.every((name) => hasRole(name));
    },
    [hasRole]
  );

  /**
   * Verifica se o usuário pode executar uma ação em um recurso
   * @param resource Nome do recurso (ex: 'budgets')
   * @param action Nome da ação (ex: 'create', 'update', 'delete')
   */
  const can = useCallback(
    (resource: string, action: string): boolean => {
      const permissionName = `${resource}.${action}`;
      // Verifica a permissão específica ou a permissão de manage
      return hasPermission(permissionName) || hasPermission(`${resource}.manage`);
    },
    [hasPermission]
  );

  /**
   * Verifica se o usuário NÃO pode executar uma ação
   * @param resource Nome do recurso
   * @param action Nome da ação
   */
  const cannot = useCallback(
    (resource: string, action: string): boolean => {
      return !can(resource, action);
    },
    [can]
  );

  /**
   * Verifica se o usuário é administrador
   */
  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  }, [hasAnyRole]);

  /**
   * Verifica se o usuário é super administrador
   */
  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('super_admin');
  }, [hasRole]);

  /**
   * Recarrega as permissões do usuário
   */
  const refresh = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [userPermissions, userRoles] = await Promise.all([
        IAMService.getUserPermissions(user.id),
        IAMService.getUserRoles(user.id).then((userRoles) =>
          userRoles.map((ur) => ur.role).filter(Boolean) as Role[]
        ),
      ]);

      setPermissions(userPermissions);
      setRoles(userRoles);
    } catch (err) {
      console.error('Erro ao recarregar permissões:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    can,
    cannot,
    isAdmin,
    isSuperAdmin,
    refresh,
  };
}

/**
 * Componente HOC para proteger conteúdo baseado em permissões
 */
interface CanProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  resource,
  action,
  fallback = null,
  children,
}: CanProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    can: canAccess,
    loading,
  } = usePermissions();

  // Enquanto está carregando, não mostra nada
  if (loading) {
    return null;
  }

  let hasAccess = false;

  // Verifica permissão única
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Verifica múltiplas permissões
  else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  // Verifica role único
  else if (role) {
    hasAccess = hasRole(role);
  }
  // Verifica múltiplos roles
  else if (roles && roles.length > 0) {
    hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
  }
  // Verifica recurso + ação
  else if (resource && action) {
    hasAccess = canAccess(resource, action);
  }

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * Componente HOC para esconder conteúdo quando NÃO tem permissão
 */
interface CannotProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  resource?: string;
  action?: string;
  children: React.ReactNode;
}

export function Cannot({
  permission,
  permissions,
  role,
  roles,
  resource,
  action,
  children,
}: CannotProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    can: canAccess,
    loading,
  } = usePermissions();

  // Enquanto está carregando, não mostra nada
  if (loading) {
    return null;
  }

  let hasAccess = false;

  // Verifica permissão única
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Verifica múltiplas permissões
  else if (permissions && permissions.length > 0) {
    hasAccess = hasAnyPermission(permissions);
  }
  // Verifica role único
  else if (role) {
    hasAccess = hasRole(role);
  }
  // Verifica múltiplos roles
  else if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }
  // Verifica recurso + ação
  else if (resource && action) {
    hasAccess = canAccess(resource, action);
  }

  // Mostra o conteúdo apenas se NÃO tiver acesso
  return <>{!hasAccess ? children : null}</>;
}

export default usePermissions;

