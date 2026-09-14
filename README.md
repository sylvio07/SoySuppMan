# Soycain — Gestion Fournisseurs

Application web de gestion et qualification de fournisseurs pour Soycain. Permet d'importer des fichiers Excel de sourcing fournisseurs, de les dédupliquer automatiquement, et d'explorer les données via une interface web.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (Postgres)
- **Parsing Excel** : xlsx (SheetJS)
- **Style** : Tailwind CSS
- **Déploiement** : Vercel

## Setup local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

Copier `.env.local.example` en `.env.local` et renseigner les clés :

```bash
cp .env.local.example .env.local
```

Remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec les valeurs de votre projet Supabase (Project Settings > API).

### 3. Créer le schéma de base de données

Ouvrir l'éditeur SQL de Supabase (SQL Editor) et coller le contenu de `supabase/schema.sql`, puis exécuter.

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur http://localhost:3000.

## Import de test

1. Ouvrir http://localhost:3000/import
2. Sélectionner le fichier `test-data/sourcing-exemple.xlsx`
3. Vérifier le résumé de prévisualisation
4. Résoudre les éventuels fournisseurs ambigus
5. Cliquer sur "Confirmer l'import"

## Pages principales

- `/` — Tableau de bord avec statistiques
- `/import` — Import de fichiers Excel/CSV
- `/suppliers` — Liste des fournisseurs (filtrable, exportable)
- `/suppliers/[id]` — Fiche détaillée d'un fournisseur
- `/products` — Liste des produits (filtrable, exportable)
- `/products/[id]` — Fiche produit avec tableau comparatif des fournisseurs

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
