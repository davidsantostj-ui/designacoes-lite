/**
 * @module hooks/useAuthGuard
 * @description Hook para verificação de autenticação e permissões de admin
 */

import { useCallback } from 'react';
import { supabase } from '../services/supabase';
import { ADMIN_UIDS } from '../constants/appConstants';

const auth = null;

/**
 * Hook para verificar autenticação e permissões administrativas
 * @param {Object} options - Opções de configuração
 * @param {Function} options.addToast - Função para exibir toasts
 * @param {boolean} options.isRealAdminUser - Se o usuário é admin real
 * @param {Function} [options.ensureAuth] - Função opcional de verificação de auth
 * @returns {Object} Funções de guarda
 */
export const useAuthGuard = ({ addToast, isRealAdminUser, ensureAuth }) => {
  /**
   * Verifica se o usuário está autenticado
   * @returns {Promise<boolean>}
   */
  const guardAuth = useCallback(async () => {
    try {
      if (ensureAuth) {
        await ensureAuth();
      } else {
        if (!auth.currentUser) {
          throw new Error('not-authenticated');
        }
      }
      return true;
    } catch (e) {
      if (addToast) {
        addToast('Faça login para continuar.', 'warn');
      }
      return false;
    }
  }, [addToast, ensureAuth]);

  /**
   * Verifica se o usuário é administrador
   * @param {string} [message] - Mensagem personalizada
   * @returns {Promise<boolean>}
   */
  const guardAdminAction = useCallback(
    async (message = 'Apenas administradores podem gerenciar designações.') => {
      if (!isRealAdminUser) {
        if (addToast) {
          addToast(message, 'warn');
        }
        return false;
      }
      return guardAuth();
    },
    [addToast, guardAuth, isRealAdminUser]
  );

  /**
   * Verifica se o UID é de administrador
   * @param {string} uid - UID do usuário
   * @returns {boolean}
   */
  const isAdminUid = useCallback((uid) => {
    return ADMIN_UIDS.includes(uid);
  }, []);

  return {
    guardAuth,
    guardAdminAction,
    isAdminUid
  };
};

export default useAuthGuard;
