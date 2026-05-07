-- Desabilitar RLS temporariamente para criar perfil
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Inserir perfil do usuário
INSERT INTO public.profiles (id, email, display_name, phone, role)
VALUES (
  '7e8497ce-12fa-4e69-916a-a8d5ef9cce65',
  'david@teste.com',
  'David Santos',
  '81984867611',
  'admin'
);

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;