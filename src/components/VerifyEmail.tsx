import { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthService } from '../services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o usuário já está verificado
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setEmail(session.user.email || '');
          
          // Verifica se o email já foi confirmado
          if (session.user.email_confirmed_at) {
            setVerified(true);
            // Redireciona após 2 segundos
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }

        // Verifica se há token de verificação na URL
        const hash = window.location.hash;
        if (hash.includes('type=signup') || hash.includes('access_token')) {
          // Processa o hash e verifica o status
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.user?.email_confirmed_at) {
            setVerified(true);
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    };

    checkVerification();
  }, [navigate]);

  const handleResend = async () => {
    if (!email) {
      setError('Email não encontrado. Por favor, faça login novamente.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await AuthService.resendVerificationEmail(email);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Erro ao reenviar email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Email verificado!</h2>
            <p className="text-gray-600 mb-6">
              Sua conta foi verificada com sucesso.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verifique seu email</h2>
          <p className="text-gray-600 mb-6">
            {email ? (
              <>
                Enviamos um link de verificação para <strong>{email}</strong>
              </>
            ) : (
              'Enviamos um link de verificação para seu email'
            )}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Clique no link no email para ativar sua conta. Se não encontrar o email, verifique também a pasta de spam.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
              <div className="text-sm text-green-700">
                Email de verificação reenviado com sucesso!
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={loading || !email}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-all duration-200 ${
              loading || !email
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
                <span>Enviando...</span>
              </div>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Email de Verificação
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}

