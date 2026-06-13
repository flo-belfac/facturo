# Sécuriser le scan IA (anti-abus / coûts OpenAI)

## Le problème
La fonction `scan-facture` pouvait être déclenchée avec la clé `anon` (publique, visible
dans le JavaScript du site). N'importe qui pouvait donc l'appeler en boucle et **épuiser
tes crédits OpenAI**.

## La solution (déjà codée)
- La fonction exige désormais un **utilisateur connecté** (un vrai token de session, pas la
  clé anon) — `supabase/functions/scan-facture/index.ts`.
- Chaque utilisateur est limité à **30 scans par jour** (modifiable : constante `DAILY_LIMIT`).
- Le comptage se fait dans une table `scan_usage` — `supabase/migrations/20260614_scan_rate_limit.sql`.
- Le front envoie maintenant le token de l'utilisateur connecté — `src/App.js`.

---

## Déploiement — l'ORDRE compte

> ⚠️ Respecte cet ordre, sinon le scan peut casser temporairement.

### 1. Base de données
Supabase → **SQL Editor** → colle le contenu de
`supabase/migrations/20260614_scan_rate_limit.sql` → **Run**.
(Crée la table `scan_usage` et la fonction de comptage.)

### 2. Front (d'abord)
Commit + push `src/App.js` → Vercel redéploie.
Le nouveau front envoie le token utilisateur. Il reste **compatible avec l'ancienne fonction**,
donc rien ne casse à cette étape.

Attends que Vercel soit **Ready**, puis recharge le site et vérifie qu'un scan marche encore.

### 3. Fonction (ensuite)
Déploie la nouvelle version de `scan-facture` :

**En ligne :** Dashboard → Edge Functions → `scan-facture` → remplace le code par celui de
`supabase/functions/scan-facture/index.ts` → **Deploy**.

**Ou en CLI :**
```bash
npx supabase functions deploy scan-facture
```

À partir de là, seul un utilisateur connecté peut scanner, et le quota s'applique.
(Les secrets `OPENAI_API_KEY` sont déjà en place ; `SUPABASE_URL`,
`SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement.)

---

## Tester

1. **Connecté** : scanne une facture → ça marche normalement.
2. **Quota** : après plusieurs scans, vérifie le compteur :
   ```sql
   select * from public.scan_usage order by jour desc;
   ```
3. **Non autorisé** : un appel sans token utilisateur doit être refusé (401) :
   ```bash
   curl -i -X POST "https://jihdihqgyvtzboqwuzmr.supabase.co/functions/v1/scan-facture" \
     -H "Content-Type: application/json" -d '{}'
   ```
   → doit renvoyer `401` « Connexion requise… » (et non lancer un appel OpenAI).

---

## Réglages
- Changer la limite : constante `DAILY_LIMIT` dans la fonction (puis redéployer).
- Surveiller la conso réelle : tableau de bord **OpenAI → Usage**.
