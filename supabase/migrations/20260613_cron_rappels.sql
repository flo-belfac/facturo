-- =====================================================================
-- Planification quotidienne des rappels par email.
-- À exécuter dans Supabase > SQL Editor APRÈS avoir déployé la fonction
-- send-rappels et défini les secrets (voir RAPPELS_SETUP.md).
--
-- >>> AVANT DE LANCER : remplace 'TON_SECRET_CRON' (2 endroits possibles)
--     par la même valeur que le secret CRON_SECRET défini côté fonction.
-- =====================================================================

-- Extensions nécessaires (déjà souvent activées sur Supabase)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Supprime une éventuelle ancienne planification du même nom (ré-exécutable)
select cron.unschedule('rappels-quotidiens')
where exists (select 1 from cron.job where jobname = 'rappels-quotidiens');

-- Planifie l'appel tous les jours à 06:00 UTC (~08:00 heure belge en été,
-- ~07:00 en hiver). Ajuste l'heure UTC si tu veux 8h pile toute l'année.
select cron.schedule(
  'rappels-quotidiens',
  '0 6 * * *',
  $$
  select net.http_post(
    url     := 'https://jihdihqgyvtzboqwuzmr.supabase.co/functions/v1/send-rappels',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'TON_SECRET_CRON'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- =====================================================================
-- Vérifier la planification :
--   select jobname, schedule, active from cron.job;
-- Voir les dernières exécutions :
--   select * from cron.job_run_details order by start_time desc limit 10;
-- Supprimer la planification si besoin :
--   select cron.unschedule('rappels-quotidiens');
-- =====================================================================
