-- =====================================================================
-- Limite d'utilisation du scan IA (anti-abus / maîtrise des coûts OpenAI).
-- Compte le nombre de scans par utilisateur et par jour, et permet de
-- refuser au-delà d'un quota.
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- =====================================================================

-- Table de comptage (1 ligne par utilisateur et par jour)
create table if not exists public.scan_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  jour    date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, jour)
);

-- RLS activée SANS policy : seule la fonction (service_role) peut y toucher,
-- les utilisateurs n'y ont aucun accès direct.
alter table public.scan_usage enable row level security;

-- Incrémente le compteur du jour et indique si on est encore dans le quota.
-- Renvoie true si l'appel est autorisé, false si le quota est dépassé.
create or replace function public.increment_scan_usage(p_user uuid, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
begin
  insert into public.scan_usage (user_id, jour, count)
  values (p_user, current_date, 1)
  on conflict (user_id, jour)
  do update set count = scan_usage.count + 1
  returning count into c;

  return c <= p_limit;
end;
$$;

-- =====================================================================
-- Suivi (optionnel) :
--   select * from public.scan_usage order by jour desc, count desc;
-- Réinitialiser un utilisateur :
--   delete from public.scan_usage where user_id = '...';
-- =====================================================================
