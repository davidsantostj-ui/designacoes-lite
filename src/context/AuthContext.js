/**
 * @module context/AuthContext
 * @description Contexto global de autenticação
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '../services/apiProvider';
import { addToast } from '../hooks/useToasts'; // placeholder, adjust import as needed

/** @typedef {import('firebase/auth').User} AuthUser */

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  authenticate: async () => false,
  canAccess: () => false
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (newUser) => {
      if (!newUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser(newUser);
      try {
        const adminSnap = await db.collection('admins').doc(newUser.uid).get();
        setIsAdmin(adminSnap.exists);
      } catch (e) {
        console.error('Erro ao buscar admin flag', e);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const authenticate = useCallback(async (requiredRoles = []) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (requiredRoles.length && !isAdmin) {
      throw new Error('Permissão insuficiente');
    }
    return true;
  }, [user, isAdmin]);

  const canAccess = useCallback((requiredRoles = []) => {
    if (!user) return false;
    if (!requiredRoles.length) return true;
    return isAdmin;
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, signOut, authenticate, canAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
