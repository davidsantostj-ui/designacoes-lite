/**
 * @module services/firebase
 * @description Adapter quewraps Supabase para manter compatibilidade com API do Firebase
 */

import { supabase } from './supabase';

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? {
        uid: session.user.id,
        email: session.user.email,
        emailVerified: session.user.email_confirmed_at,
        displayName: session.user.user_metadata?.display_name,
        photoURL: session.user.user_metadata?.avatar_url
      } : null;
      callback(user);
    });
    return () => subscription.unsubscribe();
  }
};

export const db = {
  _service: null,
  collection: (name) => ({
    name,
    _service: null
  })
};

export const storage = {};

export const app = {};