import { supabase } from '../lib/supabaseClient';

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Serviço de autenticação seguro
 * Implementa todas as funcionalidades de autenticação com validações e segurança
 */
export class AuthService {
  /**
   * Valida força da senha
   * Requisitos:
   * - Mínimo 8 caracteres
   * - Pelo menos 1 letra maiúscula
   * - Pelo menos 1 letra minúscula
   * - Pelo menos 1 número
   * - Pelo menos 1 caractere especial
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('A senha deve ter no mínimo 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida formato de email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Cadastra um novo usuário
   * Envia email de verificação automaticamente
   */
  static async signUp(data: SignUpData): Promise<{
    success: boolean;
    error?: string;
    user?: any;
  }> {
    try {
      // Validações
      if (!data.email || !data.password || !data.confirmPassword) {
        return {
          success: false,
          error: 'Todos os campos são obrigatórios',
        };
      }

      if (!this.validateEmail(data.email)) {
        return {
          success: false,
          error: 'Email inválido',
        };
      }

      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          error: 'As senhas não coincidem',
        };
      }

      const passwordValidation = this.validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. '),
        };
      }

      // Cadastro no Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: data.fullName || '',
          },
        },
      });

      if (error) {
        // Tratamento de erros específicos
        if (error.message.includes('already registered')) {
          return {
            success: false,
            error: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.',
          };
        }

        if (error.message.includes('Invalid email')) {
          return {
            success: false,
            error: 'Email inválido',
          };
        }

        return {
          success: false,
          error: error.message || 'Erro ao criar conta',
        };
      }

      return {
        success: true,
        user: authData.user,
      };
    } catch (error) {
      console.error('Erro no signup:', error);
      return {
        success: false,
        error: 'Erro inesperado ao criar conta. Tente novamente.',
      };
    }
  }

  /**
   * Faz login do usuário
   */
  static async signIn(data: SignInData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!data.email || !data.password) {
        return {
          success: false,
          error: 'Email e senha são obrigatórios',
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Email ou senha incorretos',
          };
        }

        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada.',
          };
        }

        return {
          success: false,
          error: error.message || 'Erro ao fazer login',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro no signin:', error);
      return {
        success: false,
        error: 'Erro inesperado ao fazer login. Tente novamente.',
      };
    }
  }

  /**
   * Envia email de recuperação de senha
   */
  static async forgotPassword(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email é obrigatório',
        };
      }

      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Email inválido',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Erro ao enviar email de recuperação',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro no forgotPassword:', error);
      return {
        success: false,
        error: 'Erro inesperado. Tente novamente.',
      };
    }
  }

  /**
   * Atualiza a senha do usuário (após reset)
   */
  static async updatePassword(data: UpdatePasswordData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!data.newPassword || !data.confirmPassword) {
        return {
          success: false,
          error: 'Todos os campos são obrigatórios',
        };
      }

      if (data.newPassword !== data.confirmPassword) {
        return {
          success: false,
          error: 'As senhas não coincidem',
        };
      }

      const passwordValidation = this.validatePasswordStrength(data.newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. '),
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Erro ao atualizar senha',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro no updatePassword:', error);
      return {
        success: false,
        error: 'Erro inesperado. Tente novamente.',
      };
    }
  }

  /**
   * Reenvia email de verificação
   */
  static async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email é obrigatório',
        };
      }

      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Email inválido',
        };
      }

      // O Supabase não tem uma função direta para reenviar verificação
      // Vamos usar o signUp novamente com o mesmo email (isso não cria duplicata)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Erro ao reenviar email de verificação',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro no resendVerificationEmail:', error);
      return {
        success: false,
        error: 'Erro inesperado. Tente novamente.',
      };
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static async checkAuth(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  /**
   * Faz logout
   */
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}

