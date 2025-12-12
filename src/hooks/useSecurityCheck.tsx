import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SecurityService } from '../services/securityService';
import { AuthService } from '../services/authService';

/**
 * Hook que verifica periodicamente se o usuário ainda tem acesso válido
 * Se detectar que o acesso foi revogado, faz logout e redireciona
 */
export function useSecurityCheck(intervalMs: number = 60000) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Só verifica se há sessão
    if (!session) {
      return;
    }

    // Função de verificação
    const checkSecurity = async () => {
      try {
        const securityCheck = await SecurityService.performSecurityCheck();

        if (!securityCheck.passed) {
          console.warn('Verificação de segurança falhou:', securityCheck.errors);
          // Faz logout e redireciona
          await AuthService.signOut();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Erro na verificação de segurança:', error);
        // Em caso de erro, por segurança, faz logout
        await AuthService.signOut();
        navigate('/login', { replace: true });
      }
    };

    // Verifica imediatamente
    checkSecurity();

    // Configura verificação periódica
    intervalRef.current = setInterval(checkSecurity, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, navigate, intervalMs]);
}

