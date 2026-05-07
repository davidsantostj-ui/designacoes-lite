import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ymjthrmykjimhwpojgxw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  collection: (name) => ({ name }),
  doc: (db, col, id) => ({ collection: col, id })
};

export const storage = {
  ref: (storage, path) => path
};