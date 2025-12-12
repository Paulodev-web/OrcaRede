import { supabase } from '../lib/supabaseClient';

/**
 * Serviço de segurança que verifica permissões no banco de dados
 * Todas as verificações são feitas diretamente no banco para garantir segurança
 */
export class SecurityService {
  /**
   * Verifica se o usuário atual está autenticado e tem sessão válida
   * Esta verificação é feita diretamente no banco de dados
   */
  static async verifyUserSession(): Promise<{
    valid: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return {
          valid: false,
          error: error?.message || 'Sessão inválida',
        };
      }

      // Verifica se o usuário ainda existe no banco
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          valid: false,
          error: 'Usuário não encontrado',
        };
      }

      return {
        valid: true,
        user,
      };
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return {
        valid: false,
        error: 'Erro ao verificar sessão',
      };
    }
  }

  /**
   * Verifica se o email do usuário foi confirmado
   * Esta verificação é feita diretamente no banco de dados
   */
  static async verifyEmailConfirmed(): Promise<{
    confirmed: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return {
          confirmed: false,
          error: 'Usuário não encontrado',
        };
      }

      return {
        confirmed: !!user.email_confirmed_at,
        user,
      };
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return {
        confirmed: false,
        error: 'Erro ao verificar email',
      };
    }
  }

  /**
   * Verifica se o usuário tem acesso a um recurso específico
   * Esta função pode ser estendida para verificar permissões específicas
   * quando o sistema de pagamento for implementado
   */
  static async verifyResourceAccess(resourceId?: string): Promise<{
    hasAccess: boolean;
    error?: string;
  }> {
    try {
      // Primeiro verifica se está autenticado
      const sessionCheck = await this.verifyUserSession();
      if (!sessionCheck.valid) {
        return {
          hasAccess: false,
          error: sessionCheck.error || 'Usuário não autenticado',
        };
      }

      // Verifica se o email foi confirmado
      const emailCheck = await this.verifyEmailConfirmed();
      if (!emailCheck.confirmed) {
        return {
          hasAccess: false,
          error: 'Email não confirmado',
        };
      }

      // Aqui você pode adicionar verificações específicas de recursos
      // Por exemplo, verificar se o usuário tem acesso pago, etc.
      // Quando implementar o sistema de pagamento, adicione as verificações aqui

      return {
        hasAccess: true,
      };
    } catch (error) {
      console.error('Erro ao verificar acesso ao recurso:', error);
      return {
        hasAccess: false,
        error: 'Erro ao verificar acesso',
      };
    }
  }

  /**
   * Força verificação completa de segurança
   * Usado em pontos críticos da aplicação
   */
  static async performSecurityCheck(): Promise<{
    passed: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Verifica sessão
    const sessionCheck = await this.verifyUserSession();
    if (!sessionCheck.valid) {
      errors.push(sessionCheck.error || 'Sessão inválida');
    }

    // Verifica email confirmado
    const emailCheck = await this.verifyEmailConfirmed();
    if (!emailCheck.confirmed) {
      errors.push('Email não confirmado');
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }
}

