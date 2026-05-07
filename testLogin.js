import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymjthrmykjimhwpojgxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Tentando login com david@teste.com...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'david@teste.com',
    password: 'david123'
  });

  if (error) {
    console.log('ERRO:', error.message);
    console.log('Código:', error.code);
  } else {
    console.log('LOGIN OK!');
    console.log('User:', data.user);
    console.log('Session:', data.session ? 'ativa' : 'inativa');
  }
}

testLogin();