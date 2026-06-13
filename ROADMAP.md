# Factura / facturo — Roadmap & backlog

Dernière mise à jour : 2026-06-13

**Légende**
Priorité : `P0` critique · `P1` important · `P2` utile · `P3` confort
Effort : `S` (≈ <½ j) · `M` (≈ 1 j) · `L` (≈ plusieurs jours)
Statut : ✅ fait · 🟡 prêt (reste à brancher) · ⬜ à faire

---

## ✅ Fait

### Isolation des comptes (sécurité données) — `P0`
Chaque facture est liée à son propriétaire ; un utilisateur ne voit/modifie que ses
propres factures.
- ✅ Colonne `user_id` + RLS + policies — `supabase/migrations/20260613_user_isolation.sql` (exécuté)
- ✅ Code React : `user_id` à l'écriture + filtre à la lecture — `src/App.js`
- ✅ Build vérifié, commit + push, redéployé sur Vercel
- ⬜ Reste à faire (vérif) : tester l'étanchéité avec un **2ᵉ compte** pour confirmer en réel — `S`

---

## 🟡 Prêt à brancher (prochaine session)

### Rappels par email (n°2) — `P1` · `M`
Le code est écrit ; reste la mise en place côté Supabase/Resend (~15 min).
Tout est détaillé dans **`RAPPELS_SETUP.md`**.
- 🟡 Fonction `supabase/functions/send-rappels/index.ts`
- 🟡 Planification quotidienne `supabase/migrations/20260613_cron_rappels.sql`
- ⬜ Créer un compte **Resend** + clé API
- ⬜ Définir les secrets Supabase (`RESEND_API_KEY`, `CRON_SECRET`)
- ⬜ Déployer la fonction + lancer le SQL cron
- ⬜ Tester avec une facture dont le rappel = aujourd'hui

---

## ⬜ À faire

### Sécurité / coûts

**Sécuriser la fonction `scan-facture`** — `P1` · `M` · ✅ fait (déployé & testé)
Elle était appelable avec la clé `anon` publique → risque qu'on brûle tes crédits OpenAI.
- ✅ Exiger un vrai utilisateur connecté (token de session, plus la clé anon) — fonction + `src/App.js`
- ✅ Limite de 30 scans / utilisateur / jour — `supabase/migrations/20260614_scan_rate_limit.sql` (exécuté)
- ✅ Déployé (SQL → front → fonction) et scan testé en prod le 2026-06-13
- ⬜ Surveiller la conso sur OpenAI → Usage (au fil de l'eau)

### Fiabilité / données

**Images → Supabase Storage** — `P1` · `M`
Photos et annexes sont stockées en base64 dans le JSON de chaque ligne → lignes lourdes,
chargement lent.
- Créer un bucket Storage, uploader les images, ne garder que l'URL en base
- Migrer les images existantes

**Gestion d'erreurs + feedback** — `P1` · `M`
Le code avale les erreurs en silence (`catch {}` vides) : si la sauvegarde cloud échoue,
l'utilisateur ne le sait pas.
- Afficher un message en cas d'échec de synchro
- Reprise / file d'attente des modifs non synchronisées

**Identifiant de facture en UUID** — `P1` · `S`
`id = Date.now()` peut entrer en collision (2 factures dans la même milliseconde).
- Utiliser `crypto.randomUUID()` ou laisser Supabase générer l'id

### Produit (valeur utilisateur)

**QR de paiement SEPA** — `P1` · `S` · ✅ fait (code, à déployer)
QR EPC069-12 dans l'onglet Virement : scan avec l'app bancaire → virement pré-rempli.
- ✅ Composant `src/SepaQR.js` + intégration `src/App.js` + dépendance `qrcode`
- ⬜ Commit/push (Vercel installe `qrcode` au build) puis tester un scan


**Factures récurrentes** — `P1` · `M`
Loyer, abonnements, assurances reviennent chaque mois.
- Marquer une facture comme « mensuelle / périodique »
- Régénérer automatiquement à l'échéance

**Écran statistiques** — `P2` · `M`
- Graphe dépenses par catégorie et par mois (les catégories existent déjà)
- Total payé / à payer sur la période

**Export CSV / PDF** — `P2` · `M`
- Export de la liste des factures en CSV (compta, impôts)
- Récap PDF d'une facture ou d'une période

**Scan plus robuste** — `P2` · `M`
- Accepter les **PDF** (pas seulement les images)
- Gérer les factures multi-pages
- Améliorer le prompt d'extraction (fiabilité des montants/dates/IBAN)

**PWA installable + hors-ligne** — `P2` · `L`
- Manifest + service worker pour installer l'app sur l'écran d'accueil
- Cache hors-ligne, accès appareil photo natif

### Qualité du code

**Découper `App.js`** — `P2` · `L`
888 lignes dans un seul composant.
- Extraire `FactureList`, `FactureDetail`, `ScanView`, les modales
- Sortir la logique Supabase dans un hook `useFactures`

**Réactiver ESLint** — `P2` · `S`
Le build le désactive (`DISABLE_ESLINT_PLUGIN=true`).
- Réactiver, corriger les avertissements

**Confirmation d'email à l'inscription** — `P2` · `S`
- Message clair après inscription (« vérifie ta boîte mail »)
- Gérer le cas du compte non confirmé

**Centraliser la clé Supabase** — `P3` · `S`
Elle est codée en dur à 3 endroits (`supabase.js`, `App.js`, `.env`).
- Une seule source via variables d'environnement

**Normaliser les fins de ligne** — `P3` · `S`
Du bruit CRLF/LF pollue les diffs git (vu sur AppWrapper.js, Login.js, etc.).
- Ajouter un `.gitattributes` (`* text=auto eol=lf`)
- Recommitter une fois pour normaliser

**Nettoyer le code mort** — `P3` · `S`
- Constante `STORAGE_KEY` quasi inutilisée
- `src/App.test.js` (test CRA par défaut, non adapté)

---

## Ordre suggéré

1. **Vérif n°1** : test étanchéité avec un 2ᵉ compte (rapide)
2. **Rappels email** (déjà prêt) → brancher Resend
3. **Sécuriser le scan** (coûts OpenAI)
4. **Factures récurrentes** (gros gain produit)
5. **Images → Storage** + **gestion d'erreurs** (fiabilité)
6. Le reste (stats, export, PWA, refacto) au fil de l'eau
