# SOURCIO — Gestion Fournisseurs

Application web de gestion et qualification de fournisseurs pour Soycain. Permet d'importer des fichiers Excel de sourcing fournisseurs, de les dédupliquer automatiquement, et d'explorer les données via une interface web sécurisée.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (Postgres)
- **Authentification** : Supabase Auth (email/mot de passe)
- **Parsing Excel** : xlsx (SheetJS)
- **Style** : Tailwind CSS
- **Déploiement** : Vercel

## Setup local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec les valeurs de votre projet Supabase (Project Settings > API).

### 3. Créer le schéma de base de données

Ouvrir l'éditeur SQL de Supabase (SQL Editor) et exécuter dans cet ordre :

1. `supabase/schema.sql` — crée les tables
2. `supabase/rls-policies.sql` — active RLS et pose les politiques d'accès

> ⚠️ Sans `rls-policies.sql`, la base accepte des requêtes anonymes. L'exécuter est obligatoire avant la mise en production.

### 4. Créer le premier utilisateur

Aller dans le **dashboard Supabase > Authentication > Users > Invite user** et entrer l'email du premier utilisateur. Il recevra un lien par email pour définir son mot de passe.

> L'inscription publique est désactivée intentionnellement — tous les comptes sont créés manuellement.

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur http://localhost:3000. Toute route non authentifiée redirige vers `/login`.

---

## Authentification

L'application utilise **Supabase Auth** avec email/mot de passe. Le middleware Next.js (`middleware.js`) intercepte chaque requête et vérifie la session :

- Si la session est valide → accès autorisé
- Si pas de session → redirection vers `/login`

La protection est également active **côté base de données** via les RLS policies (`supabase/rls-policies.sql`). Même sans la protection UI, un utilisateur non authentifié ne peut pas lire ni écrire de données.

### Créer un utilisateur

1. Dashboard Supabase → **Authentication → Users**
2. Cliquer **Invite user**
3. Entrer l'email — l'utilisateur reçoit un lien de configuration de mot de passe

### Se connecter

Aller sur `/login`, entrer email et mot de passe.

### Se déconnecter

Cliquer sur **Déconnexion** dans la barre de navigation (desktop: en haut à droite, mobile: en bas du menu).

---

## Import de données

1. Ouvrir `/import`
2. Sélectionner un fichier Excel (.xlsx, .xls) ou CSV
3. Vérifier le résumé de prévisualisation
4. Résoudre les fournisseurs ambigus si nécessaire
5. Cliquer "Confirmer l'import"

## Pages principales

| Route | Description |
|---|---|
| `/` | Tableau de bord avec statistiques |
| `/import` | Import de fichiers Excel/CSV |
| `/suppliers` | Liste des fournisseurs (filtrable, exportable) |
| `/suppliers/[id]` | Fiche fournisseur avec offres et documents |
| `/products` | Liste des produits (filtrable, exportable) |
| `/products/[id]` | Fiche produit avec tableau comparatif fournisseurs |
| `/categories` | Liste des catégories |
| `/categories/[id]` | Fiche catégorie avec ses produits |
| `/login` | Page de connexion |

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (ex: `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |

## Déploiement Vercel

1. Pousser le code sur GitHub
2. Importer le dépôt dans Vercel
3. Ajouter les deux variables d'environnement dans les settings Vercel
4. Déployer — Vercel redéploie automatiquement à chaque push sur `main`
