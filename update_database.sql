-- ================================================================
-- PASSO 1: Adicionar a coluna pin (se ainda não existir)
-- ================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin text DEFAULT '1234';

-- ================================================================
-- PASSO 2: Inserir o usuário Admin "David Santos"
-- ================================================================
INSERT INTO public.users (name, email, role, pin)
VALUES ('David Santos', 'david@admin.com', 'admin', '1804')
ON CONFLICT (email) DO UPDATE
  SET role = 'admin', pin = '1804', name = 'David Santos';

-- ================================================================
-- PASSO 3 (OBRIGATÓRIO): Configurar RLS Policies
-- Sem isso, o app não consegue ler nenhum dado do banco!
-- ================================================================

-- Ativar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso total (necessário para o app funcionar)
-- Se as políticas já existirem, ignore os erros e vá para o próximo passo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'allow_all_users') THEN
    CREATE POLICY "allow_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'allow_all_assignments') THEN
    CREATE POLICY "allow_all_assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notices' AND policyname = 'allow_all_notices') THEN
    CREATE POLICY "allow_all_notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tips' AND policyname = 'allow_all_tips') THEN
    CREATE POLICY "allow_all_tips" ON public.tips FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_service' AND policyname = 'allow_all_field_service') THEN
    CREATE POLICY "allow_all_field_service" ON public.field_service FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_links' AND policyname = 'allow_all_quick_links') THEN
    CREATE POLICY "allow_all_quick_links" ON public.quick_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- ================================================================
-- PASSO 4: Verificar se o usuário foi criado corretamente
-- ================================================================
SELECT id, name, email, role, pin FROM public.users;
