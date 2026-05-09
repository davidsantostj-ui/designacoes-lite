-- Esquema do Banco de Dados para rodar no SQL Editor do Supabase

-- Tabela de Usuários (Recomendamos vincular com Supabase Auth no futuro)
CREATE TABLE public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

-- Tabela de Designações
CREATE TABLE public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'))
);

-- Tabela de Avisos
CREATE TABLE public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  date date DEFAULT current_date,
  special_date date
);

-- Tabela de Dicas Espirituais
CREATE TABLE public.tips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  active boolean DEFAULT false
);

-- Tabela de Serviço de Campo
CREATE TABLE public.field_service (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week text NOT NULL,
  time time NOT NULL,
  type text NOT NULL CHECK (type IN ('Presencial', 'Zoom')),
  location_or_link text NOT NULL,
  conductor text NOT NULL
);

-- Tabela de Links Rápidos
CREATE TABLE public.quick_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL
);
