import { useState, FormEvent, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthService, UpdatePasswordData } from '../services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function ResetPassword() {
  const [formData, setFormData] = useState<UpdatePasswordData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Processa o hash de recuperação da URL e verifica token
    const checkToken = async () => {
      try {
        // Primeiro, verifica se já há uma sessão
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setValidToken(true);
          return;
        }

        // Se não há sessão, verifica se há hash de recuperação na URL
        const hash = window.location.hash;
        if (hash.includes('access_token') || hash.includes('type=recovery')) {
          // O Supabase processa automaticamente o hash quando chamamos getSession()
          // Mas precisamos garantir que o hash seja processado
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Erro ao processar hash:', error);
            setValidToken(false);
            return;
          }

          if (session) {
            setValidToken(true);
          } else {
            // Hash pode estar sendo processado, tenta novamente
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              setValidToken(!!retrySession);
            }, 500);
          }
        } else {
          setValidToken(false);
        }
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        setValidToken(false);
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Garante que há uma sessão válida (processada do hash)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Tenta processar o hash novamente
        const hash = window.location.hash;
        if (hash.includes('access_token') || hash.includes('type=recovery')) {
          // Aguarda um pouco para o Supabase processar o hash
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          
          if (retryError || !retrySession) {
            throw new Error('Token de recuperação inválido ou expirado. Por favor, solicite um novo link.');
          }
        } else {
          throw new Error('Token de recuperação não encontrado. Por favor, solicite um novo link.');
        }
      }

      // Atualiza a senha
      const result = await AuthService.updatePassword(formData);

      if (result.success) {
        setSuccess(true);
        // O redirecionamento será feito pelo useEffect quando success mudar
      } else {
        setError(result.error || 'Erro ao atualizar senha');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar senha');
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando...</p>
        </div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
            <p className="text-gray-600 mb-6">
              O link de recuperação de senha é inválido ou já expirou.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Por favor, solicite um novo link de recuperação de senha.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Solicitar Novo Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Efeito para redirecionar após sucesso
  useEffect(() => {
    if (success) {
      // Limpa o hash da URL imediatamente
      window.history.replaceState(null, '', window.location.pathname);
      
      // Redireciona após 2 segundos
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Senha atualizada!</h2>
            <p className="text-gray-600 mb-6">
              Sua senha foi atualizada com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Você será redirecionado para a página de login em instantes...
            </p>
            <button
              onClick={() => {
                window.history.replaceState(null, '', window.location.pathname);
                navigate('/login', { replace: true });
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir para Login Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OrçaRede</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Redefinir Senha</h2>
          <p className="text-sm text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Confirme sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-all duration-200 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Atualizando...</span>
                </div>
              ) : (
                'Atualizar Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

