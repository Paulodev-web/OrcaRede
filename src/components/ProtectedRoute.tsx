import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AuthService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * Componente que protege rotas verificando:
 * 1. Se o usuário está autenticado
 * 2. Se o email foi confirmado (se necessário)
 * 3. Se a sessão ainda é válida no banco de dados
 */
export function ProtectedRoute({ 
  children, 
  requireEmailVerification = true 
}: ProtectedRouteProps) {
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      // Se não há sessão ou usuário, redireciona imediatamente (não precisa aguardar loading)
      if (!session || !user) {
        if (!loading) {
          console.warn('Usuário não autenticado, redirecionando para login');
          navigate('/login', { replace: true });
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }

      // Aguarda o AuthContext terminar de carregar apenas se há sessão
      if (loading) {
        return;
      }

      try {

        // 2. Verifica se o email foi confirmado (se necessário)
        if (requireEmailVerification && !user.email_confirmed_at) {
          console.warn('Email não confirmado, redirecionando para verificação');
          navigate('/verify-email', { replace: true });
          return;
        }

        // 3. Verifica no banco se a sessão ainda é válida
        // Isso garante que mesmo que alguém consiga burlar o frontend,
        // o banco de dados vai verificar e negar acesso
        const { data: { session: dbSession }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError || !dbSession) {
          console.warn('Sessão inválida no banco de dados, fazendo logout');
          await AuthService.signOut();
          navigate('/login', { replace: true });
          return;
        }

        // 4. Verifica se o usuário ainda existe e está ativo no banco
        const { data: dbUser, error: userError } = await supabase.auth.getUser();

        if (userError || !dbUser.user) {
          console.warn('Usuário não encontrado no banco de dados, fazendo logout');
          await AuthService.signOut();
          navigate('/login', { replace: true });
          return;
        }

        // 5. Verifica novamente o email confirmado no banco
        if (requireEmailVerification && !dbUser.user.email_confirmed_at) {
          console.warn('Email não confirmado no banco de dados, redirecionando');
          navigate('/verify-email', { replace: true });
          return;
        }

        // Todas as verificações passaram
        setAuthorized(true);
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        // Em caso de erro, por segurança, redireciona para login
        await AuthService.signOut();
        navigate('/login', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    verifyAccess();
  }, [session, user, loading, navigate, requireEmailVerification]);

  // Mostra loading enquanto verifica
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não autorizado, não renderiza nada (já redirecionou)
  if (!authorized) {
    return null;
  }

  // Renderiza o conteúdo protegido
  return <>{children}</>;
}

