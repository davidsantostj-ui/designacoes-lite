-- Adicionar a coluna pin na tabela users
ALTER TABLE public.users ADD COLUMN pin text DEFAULT '1234';

-- Atualizar o Auto-Seed (caso o banco esteja vazio)
-- No App, o Admin será o João, então ele usará a senha 1234 inicialmente.
