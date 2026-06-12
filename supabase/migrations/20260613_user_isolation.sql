-- =====================================================================
-- Migration : isolation des factures par utilisateur (user_id + RLS)
-- Date : 2026-06-13
--
-- À exécuter dans Supabase : Dashboard > SQL Editor > coller > Run.
-- Idempotent : peut être relancé sans danger.
-- =====================================================================

-- 1) Colonne user_id, remplie automatiquement par auth.uid() à l'insertion
alter table public.factures
  add column if not exists user_id uuid
  references auth.users (id) on delete cascade
  default auth.uid();

-- 2) Backfill des factures déjà présentes (créées avant cette migration).
--    Elles n'ont pas de user_id : on les rattache à ton compte.
--    >>> Remplace l'email si besoin. <<<
update public.factures
  set user_id = (select id from auth.users where email = 'floduti17@gmail.com')
  where user_id is null;

-- 3) Index pour des lectures rapides par utilisateur
create index if not exists factures_user_id_idx on public.factures (user_id);

-- 4) Activation de la Row Level Security
alter table public.factures enable row level security;

-- 5) Politiques d'accès : chacun ne voit/modifie que SES factures
drop policy if exists "factures_select_own" on public.factures;
create policy "factures_select_own"
  on public.factures for select
  using (auth.uid() = user_id);

drop policy if exists "factures_insert_own" on public.factures;
create policy "factures_insert_own"
  on public.factures for insert
  with check (auth.uid() = user_id);

drop policy if exists "factures_update_own" on public.factures;
create policy "factures_update_own"
  on public.factures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "factures_delete_own" on public.factures;
create policy "factures_delete_own"
  on public.factures for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- Vérification (optionnel) : après exécution, cette requête doit
-- renvoyer 0 ligne. Sinon, des factures n'ont pas été rattachées.
--   select count(*) from public.factures where user_id is null;
-- =====================================================================
