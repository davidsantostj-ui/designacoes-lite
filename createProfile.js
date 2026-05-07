const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymjthrmykjimhwpojgxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfile() {
  const userId = '7e8497ce-12fa-4e69-916a-a8d5ef9cce65';
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: 'david@teste.com',
      display_name: 'David Santos',
      phone: '81984867611',
      role: 'admin'
    });
  
  if (error) {
    console.log('Erro ao criar perfil:', error.message);
  } else {
    console.log('Perfil criado com sucesso!');
  }
}

createProfile();