# Mise en place des rappels par email

Objectif : chaque matin (~8h), PayDay envoie un email pour chaque facture dont la date
de rappel tombe ce jour-là et qui n'est pas encore payée.

Pièces livrées :
- `supabase/functions/send-rappels/index.ts` — la fonction qui envoie les emails
- `supabase/migrations/20260613_cron_rappels.sql` — la planification quotidienne
- bloc `[functions.send-rappels]` ajouté dans `supabase/config.toml`

Il reste **5 étapes** à faire une seule fois. Compte ~15 minutes.

---

## Étape 1 — Créer un compte Resend (service d'envoi d'emails)

1. Va sur https://resend.com et crée un compte gratuit (100 emails/jour, largement suffisant).
2. Menu **API Keys** → **Create API Key** → donne-lui un nom (ex. « PayDay ») → copie la clé
   (elle commence par `re_…`). **Garde-la de côté**, on s'en sert à l'étape 2.

> Note : par défaut, Resend ne laisse envoyer **que vers ta propre adresse** (celle du compte),
> depuis l'expéditeur `onboarding@resend.dev`. C'est parfait pour ton usage perso.
> Si un jour d'autres personnes utilisent l'app, il faudra **vérifier un domaine** dans Resend
> (menu Domains) et renseigner le secret `RAPPELS_FROM_EMAIL` (ex. `PayDay <rappels@tondomaine.com>`).

## Étape 2 — Définir les secrets côté Supabase

Dashboard Supabase → **Edge Functions** → onglet **Secrets** (ou Project Settings → Edge Functions).
Ajoute :

| Nom | Valeur |
|-----|--------|
| `RESEND_API_KEY` | la clé `re_…` de l'étape 1 |
| `CRON_SECRET` | un mot de passe au hasard que tu inventes (ex. `payday-7h2k9x`) — note-le, il sert à l'étape 4 |

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont déjà fournis automatiquement, rien à faire.
> `RAPPELS_FROM_EMAIL` est optionnel (défaut : `PayDay <onboarding@resend.dev>`).

## Étape 3 — Déployer la fonction

**Option A — en ligne (le plus simple) :** Dashboard → **Edge Functions** → **Deploy a new function**
→ nomme-la exactement `send-rappels` → colle tout le contenu de
`supabase/functions/send-rappels/index.ts` → **Deploy**.

**Option B — en ligne de commande** (si tu as la CLI Supabase) :
```bash
npx supabase functions deploy send-rappels --no-verify-jwt
```

## Étape 4 — Planifier l'envoi quotidien

1. Ouvre `supabase/migrations/20260613_cron_rappels.sql`.
2. Remplace `TON_SECRET_CRON` par **exactement** la valeur de `CRON_SECRET` choisie à l'étape 2.
3. Colle le tout dans **SQL Editor** → **Run**.

Ça crée une tâche « rappels-quotidiens » qui appelle la fonction chaque jour à 06:00 UTC,
soit ~8h en Belgique l'été (~7h l'hiver). Pour viser 8h pile toute l'année, change `0 6 * * *`
en `0 7 * * *` (hiver) selon la saison.

## Étape 5 — Tester tout de suite (sans attendre demain matin)

1. Dans l'app, ouvre une facture **non payée**, mets un rappel à **la date d'aujourd'hui**.
2. Déclenche la fonction à la main. Dans un terminal (remplace `TON_SECRET_CRON`) :
   ```bash
   curl -i -X POST "https://jihdihqgyvtzboqwuzmr.supabase.co/functions/v1/send-rappels" \
     -H "x-cron-secret: TON_SECRET_CRON"
   ```
   La réponse indique `"due"` (factures concernées) et `"sent"` (emails envoyés).
3. Vérifie ta boîte mail. Tu peux aussi voir l'historique d'envoi dans Resend (menu **Emails**).

---

## Dépannage rapide

- **`"RESEND_API_KEY manquant"`** → secret pas défini (ou fonction pas redéployée après l'avoir ajouté).
- **`"unauthorized"`** → le `x-cron-secret` envoyé ne correspond pas au secret `CRON_SECRET`.
- **`due: 0`** → aucune facture avec `rappel` = aujourd'hui et non payée. Vérifie la date du rappel.
- **Email parti mais pas reçu** → regarde les logs dans Resend ; si l'adresse n'est pas celle de
  ton compte Resend et qu'aucun domaine n'est vérifié, Resend bloque l'envoi (voir note étape 1).
- **Voir les exécutions planifiées** : `select * from cron.job_run_details order by start_time desc limit 10;`
