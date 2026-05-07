const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymjthrmykjimhwpojgxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVerifiedUser() {
  // Criar usuário diretamente na tabela de auth usando a API admin
  // Primeiro, vamos tentar login para ver o erro
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'david@teste.com',
    password: 'david123'
  });
  
  if (error) {
    console.log('Erro no login:', error.message);
    console.log('Código do erro:', error.code);
  } else {
    console.log('Login OK!');
    console.log('Usuário:', data.user);
  }
}

createVerifiedUser();