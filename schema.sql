-- ============================================================
-- Akatsuki Hub - schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- PROFILES ---------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  title text default 'Genin',
  level int default 1,
  xp int default 0,
  ryos int default 200,
  color_code text default '#ffffff',
  border_equip text,
  emoji_equip text,
  last_daily date,
  created_at timestamptz default now()
);

-- MESSAGES -----------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  channel text not null default 'general',
  content text not null,
  created_at timestamptz default now()
);

-- SHOP ITEMS ---------------------------------------------------
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('border', 'color', 'emoji')),
  name text not null,
  price int not null,
  css_value text not null,
  rarity text default 'commun'
);

-- SPINS (roue Sharingan) ----------------------------------------
create table if not exists public.spins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_spin timestamptz
);

-- INVENTORY ------------------------------------------------------
create table if not exists public.inventory (
  user_id uuid references public.profiles(id) on delete cascade,
  item_id uuid references public.shop_items(id) on delete cascade,
  acquired_at timestamptz default now(),
  primary key (user_id, item_id)
);

-- ============================================================
-- Auto-création du profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.shop_items enable row level security;
alter table public.spins enable row level security;
alter table public.inventory enable row level security;

-- Profiles: tout le monde peut lire, seul le propriétaire modifie
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Messages: tout le monde lit, un user authentifié écrit ses propres messages
create policy "messages_select_all" on public.messages for select using (true);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = user_id);

-- Shop items: lecture publique (pas d'écriture depuis le client)
create policy "shop_items_select_all" on public.shop_items for select using (true);

-- Spins: chacun lit/modifie sa propre ligne
create policy "spins_select_own" on public.spins for select using (auth.uid() = user_id);
create policy "spins_upsert_own" on public.spins for insert with check (auth.uid() = user_id);
create policy "spins_update_own" on public.spins for update using (auth.uid() = user_id);

-- Inventory: chacun lit/ajoute ses propres items
create policy "inventory_select_own" on public.inventory for select using (auth.uid() = user_id);
create policy "inventory_insert_own" on public.inventory for insert with check (auth.uid() = user_id);

-- ============================================================
-- Quelques items de boutique de départ (à adapter)
-- ============================================================
insert into public.shop_items (type, name, price, css_value, rarity) values
  ('border', 'Bordure Sharingan', 300, '2px solid #ff3b3b', 'rare'),
  ('border', 'Bordure Or Akatsuki', 800, '2px solid #d4af37', 'légendaire'),
  ('border', 'Bordure Ombre', 150, '2px solid #4a4a4a', 'commun'),
  ('color', 'Rouge Sang', 100, '#ff3b3b', 'commun'),
  ('color', 'Or Impérial', 500, '#d4af37', 'rare'),
  ('color', 'Violet Rinnegan', 400, '#9b30ff', 'rare'),
  ('emoji', 'Nuage Rouge', 200, '☁️', 'commun'),
  ('emoji', 'Sharingan', 600, '🔴', 'rare'),
  ('emoji', 'Kunai', 150, '🗡️', 'commun')
on conflict do nothing;
