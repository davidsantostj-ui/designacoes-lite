const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymjthrmykjimhwpojgxw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDI5NywiZXhwIjoyMDkzNzQwMjk3fQ.YAzgr_jFJXRXqRqqIx6I8lb1eR80iV-7yqrvy2xewGI';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser() {
  // Confirmar usuário usando admin API
  const { error } = await supabase.auth.admin.updateUserById(
    '7e8497ce-12fa-4e69-916a-a8d5ef9cce65',
    { email_confirm: true }
  );
  
  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('Usuário confirmado com sucesso!');
  }
}

confirmUser();