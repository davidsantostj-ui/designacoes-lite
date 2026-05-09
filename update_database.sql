-- ================================================================
-- PASSO 1: Adicionar a coluna pin (se ainda não existir)
-- ================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin text DEFAULT '1234';

-- ================================================================
-- PASSO 2: Inserir o usuário Admin "David Santos"
-- Execute este bloco no SQL Editor do Supabase
-- ================================================================
INSERT INTO public.users (name, email, role, pin)
VALUES ('David Santos', 'david@admin.com', 'admin', '1804')
ON CONFLICT (email) DO UPDATE
  SET role = 'admin', pin = '1804', name = 'David Santos';

-- ================================================================
-- PASSO 3 (Opcional): Verificar se o usuário foi criado
-- ================================================================
-- SELECT * FROM public.users WHERE email = 'david@admin.com';
