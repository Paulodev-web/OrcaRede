import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { IAMService } from '../services/iamService';
import type { Permission, Role, UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
  can: (resource: string, action: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega dados do usuário (profile, roles, permissions)
  const loadUserData = async (userId: string) => {
    try {
      const [profile, userPermissions, userRoles] = await Promise.all([
        IAMService.getUserProfile(userId),
        IAMService.getUserPermissions(userId),
        IAMService.getUserRoles(userId).then((userRoles) =>
          userRoles.map((ur) => ur.role).filter(Boolean) as Role[]
        ),
      ]);

      setUserProfile(profile);
      setPermissions(userPermissions);
      setRoles(userRoles);

      // Atualiza último login
      await IAMService.updateLastLogin(userId);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Limpa dados do usuário
  const clearUserData = () => {
    setUserProfile(null);
    setPermissions([]);
    setRoles([]);
  };

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    async function initAuth() {
      try {
        // Busca a sessão inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao buscar sessão:', error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Carrega dados do usuário se houver sessão
          if (session?.user) {
            await loadUserData(session.user.id);
          }
          
          setLoading(false);
        }

        // Assina as mudanças de estado de autenticação apenas após buscar a sessão inicial
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (mounted) {
            console.log('Auth state change:', _event, !!session);
            setSession(session);
            setUser(session?.user ?? null);
            
            // Carrega ou limpa dados do usuário
            if (session?.user) {
              await loadUserData(session.user.id);
            } else {
              clearUserData();
            }
            
            setLoading(false);
          }
        });

        subscription = data.subscription;
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Cleanup: cancela a assinatura quando o componente for desmontado
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      clearUserData();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Recarrega dados do usuário manualmente
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  // Verifica se usuário tem uma permissão específica
  const hasPermission = (permissionName: string): boolean => {
    return permissions.some((p) => p.name === permissionName);
  };

  // Verifica se usuário tem um role específico
  const hasRole = (roleName: string): boolean => {
    return roles.some((r) => r.name === roleName);
  };

  // Verifica se usuário pode executar uma ação em um recurso
  const can = (resource: string, action: string): boolean => {
    const permissionName = `${resource}.${action}`;
    return hasPermission(permissionName) || hasPermission(`${resource}.manage`);
  };

  // Verifica se usuário é administrador
  const isAdmin = (): boolean => {
    return hasRole('super_admin') || hasRole('admin');
  };

  const value = {
    session,
    user,
    userProfile,
    roles,
    permissions,
    loading,
    signOut,
    refreshUserData,
    hasPermission,
    hasRole,
    can,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}