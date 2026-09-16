# Akatsuki Hub

Site communautaire Naruto/Akatsuki — chat temps réel, profils avec XP/niveaux, boutique de cosmétiques et mini-jeux, propulsé par React + Tailwind + Supabase.

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un nouveau projet.
2. Dans **SQL Editor**, colle et exécute le contenu de `schema.sql` (crée les tables, le trigger de création de profil, les policies RLS, et quelques objets de boutique de départ).
3. Dans **Authentication > Providers**, vérifie que "Email" est activé (tu peux désactiver la confirmation par email en dev pour aller plus vite).
4. Récupère `Project URL` et `anon public key` dans **Project Settings > API**.

## 2. Configurer le projet local

```bash
npm install
cp .env.example .env
```

Remplis `.env` :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 3. Lancer en dev

```bash
npm run dev
```

## 4. Build production

```bash
npm run build
```

## Notes sur l'implémentation

- **XP / Niveaux** : chaque message envoyé donne +10 XP et +10 Ryôs. Un niveau = 100 XP ; passer un niveau donne +100 Ryôs bonus (toast affiché). Les titres sont Genin (niv. 1-4), Chûnin (5-9), Jônin (10+) — ajustables dans `titleForLevel()` dans `App.jsx`.
- **Chat** : réalisé avec Supabase Realtime (`postgres_changes` sur la table `messages`, canal `general`). Facile à étendre à d'autres canaux en dupliquant la logique de `GeneralPage` avec un `channel` différent.
- **Boutique** : achats déduits des Ryôs et enregistrés dans `inventory` ; "équiper" met à jour `border_equip` / `color_code` / `emoji_equip` sur le profil.
- **Roue Sharingan** : 1 spin gratuit / 24h (suivi via la table `spins`), sinon 100 Ryôs par tour. Gains : 10/50/100/200/500 Ryôs ou un bonus de 300 Ryôs.
- **Quiz Akatsuki** : 10 questions tirées aléatoirement parmi une banque de 20, +10 Ryôs par bonne réponse.
- Les policies RLS fournies sont volontairement simples (lecture publique, écriture limitée au propriétaire) — à durcir avant une mise en production réelle (ex. valider le contenu des messages côté base, limiter le débit d'envoi, etc.).
- Le +10 Ryôs/XP par message et le crédit du quiz sont calculés côté client puis écrits en base : pour une vraie protection anti-triche, il vaudrait mieux déplacer cette logique dans une Supabase Edge Function / RPC Postgres plutôt que de faire confiance au client.
