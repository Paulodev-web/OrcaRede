'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { SecurityService } from '../services/securityService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
        }

        // Assina as mudanças de estado de autenticação apenas após buscar a sessão inicial
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (mounted) {
            console.log('Auth state change:', _event, !!session);
            
            // Se há sessão, verifica no banco se ainda é válida
            if (session) {
              const securityCheck = await SecurityService.verifyUserSession();
              if (!securityCheck.valid) {
                // Sessão inválida no banco, limpa o estado
                console.warn('Sessão inválida detectada, fazendo logout');
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
              }
            }
            
            setSession(session);
            setUser(session?.user ?? null);
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
      // Limpa o estado primeiro para garantir que a UI atualize
      setSession(null);
      setUser(null);
      
      // Faz logout no Supabase (isso vai disparar onAuthStateChange)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, mantém o estado limpo
      }
      
      // Força uma atualização adicional para garantir
      // Aguarda um pouco para o evento onAuthStateChange processar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Garante que o estado está limpo
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, ainda limpa o estado
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
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