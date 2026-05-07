const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymjthrmykjimhwpojgxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'david@teste.com',
    password: 'david123',
    options: {
      data: {
        display_name: 'David Santos',
        phone: '81984867611'
      }
    }
  });
  
  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('Usuário criado!');
    console.log('ID:', data.user.id);
    console.log('Email:', data.user.email);
  }
}

createUser();