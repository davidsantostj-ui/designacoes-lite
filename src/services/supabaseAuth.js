/**
 * @module services/supabaseAuth
 * @description Wrapper para Supabase Auth - Migração de Firebase Auth
 */

import { supabase } from './supabase';

/**
 * Escuta mudan�as no estado de autentica��o
 * @param {Function} callback - Fun��o chamada com o usu�rio atual
 * @returns {Function} Fun��o para cancelar a assinatura
 */
export const onAuthStateChanged = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;
    callback(user);
  });

  return () => subscription.unsubscribe();
};

/**
 * Sign in with email and password
 * @param {string} email - Email do usu�rio
 * @param {string} password - Senha do usu�rio
 * @returns {Promise<{user: Object, session: Object}>}
 */
export const signInWithEmail = async (email, password) => {
  console.log('=== LOGIN DEBUG ===');
  console.log('URL:', supabase.supabaseUrl);
  console.log('Email:', email);
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });
    console.log('Sucesso:', result);
    if (result.error) throw result.error;
    return result;
  } catch (err) {
    console.log('Erro:', err.message, err.status, err.code);
    throw err;
  }
};

/**
 * Sign up with email and password
 * @param {string} email - Email do usu�rio
 * @param {string} password - Senha do usu�rio
 * @param {Object} options - Op��es adicionais (ex: metadata)
 * @returns {Promise<{user: Object, session: Object}>}
 */
export const signUpWithEmail = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options.metadata || {}
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Send password reset email
 * @param {string} email - Email do usu�rio
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) throw error;
};

/**
 * Update user password
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Usu�rio atualizado
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data.user;
};

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} Usu�rio atual ou null
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
};

/**
 * Update user profile (display name)
 * @param {Object} profileData - Dados do perfil (displayName, etc)
 * @returns {Promise<Object>} Usu�rio atualizado
 */
export const updateProfile = async (profileData) => {
  const { data, error } = await supabase.auth.updateUser({
    data: profileData
  });

  if (error) throw error;
  return data.user;
};

/**
 * Get current session
 * @returns {Promise<Object|null>} Sess�o atual ou null
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
};

/**
 * Reauthenticate user with email/password (for sensitive operations)
 * @param {string} email - Email do usu�rio
 * @param {string} password - Senha do usu�rio
 * @returns {Promise<void>}
 */
export const reauthenticate = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
};

