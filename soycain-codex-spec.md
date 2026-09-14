# Soycain — Application de gestion et qualification de fournisseurs

## Contexte pour l'agent (Codex)

Tu dois construire, de bout en bout, une application web permettant d'importer un fichier Excel de sourcing fournisseurs, de le transformer automatiquement en base de données structurée, et de l'explorer via une interface web simple. L'app doit être déployable sur Vercel (plan gratuit) avec Supabase (plan gratuit) comme base de données.

Exécute les étapes dans l'ordre. Chaque étape a un critère de "done" vérifiable. Ne demande une intervention humaine QUE lorsque c'est explicitement marqué **[ACTION HUMAINE REQUISE]** — pour tout le reste, prends les décisions toi-même et documente-les dans un fichier `DECISIONS.md` à la racine du projet.

---

## Stack technique imposée

- **Frontend + backend léger** : Next.js 14+ (App Router), déployé sur Vercel
- **Base de données** : Supabase (Postgres géré, client JS direct depuis le frontend — pas de serveur API custom nécessaire pour le CRUD)
- **Parsing Excel** : `xlsx` (SheetJS), exécuté côté client dans le navigateur
- **Style** : Tailwind CSS (déjà inclus dans le starter Next.js)
- **Langage** : JavaScript (ou TypeScript si tu préfères, à documenter dans DECISIONS.md)

Ne remplace pas ce stack par autre chose, même si une alternative te semble meilleure — sauf si une étape est techniquement bloquée, auquel cas documente le blocage et la solution de contournement choisie dans `DECISIONS.md`.

---

## Étape 0 — Prérequis [ACTION HUMAINE REQUISE]

Avant de commencer, l'humain doit :
1. Créer un compte gratuit sur https://supabase.com
2. Créer un nouveau projet Supabase (nom libre, région proche du Togo/Europe si possible)
3. Récupérer dans Project Settings > API :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Fournir ces deux valeurs à l'agent (via variables d'environnement ou fichier `.env.local`, jamais commit sur Git)
5. Créer un compte gratuit sur https://vercel.com et le lier à un compte GitHub

Si ces valeurs ne sont pas encore disponibles, l'agent doit quand même écrire tout le code et documenter précisément où coller les clés (`.env.local.example`), sans bloquer le reste du travail.

---

## Étape 1 — Initialisation du projet

- Génère un projet Next.js (App Router, Tailwind CSS activé, pas de `src/` directory pour rester simple)
- Installe les dépendances : `@supabase/supabase-js`, `xlsx`
- Crée `.env.local.example` avec :
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ```
- Crée `lib/supabase.js` exportant un client Supabase initialisé à partir des variables d'environnement `NEXT_PUBLIC_*`

**Done quand** : `npm run dev` démarre sans erreur sur une page d'accueil par défaut.

---

## Étape 2 — Schéma de base de données

Crée un fichier `supabase/schema.sql` contenant exactement ce schéma (adapte les types si besoin mais garde la structure relationnelle) :

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  description text,
  specs_required text,
  certifications_required text,
  quality_docs_required text,
  packaging_required text,
  created_at timestamptz default now(),
  unique (category_id, name)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_name_normalized text generated always as (lower(trim(company_name))) stored,
  country text,
  address text,
  city text,
  website text,
  phone text,
  email text,
  contact_person text,
  contact_role text,
  comments text,
  status text default 'À vérifier',
  created_at timestamptz default now(),
  last_verified_at timestamptz
);

create index idx_suppliers_name_normalized on suppliers (company_name_normalized);

create table offers (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  available_quantity text,
  moq text,
  technical_specs text,
  certifications text,
  quality_docs_available text,
  price numeric,
  currency text,
  incoterm text,
  origin text,
  packaging text,
  availability text,
  comments text,
  status text default 'À vérifier',
  verified_at timestamptz,
  created_at timestamptz default now(),
  unique (supplier_id, product_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  offer_id uuid references offers(id) on delete cascade,
  doc_type text,
  file_url text not null,
  file_name text,
  uploaded_at timestamptz default now()
);
```

**Done quand** : le fichier `supabase/schema.sql` existe et est syntaxiquement valide. **[ACTION HUMAINE REQUISE]** : coller ce SQL dans l'éditeur SQL de Supabase et l'exécuter (l'agent ne peut pas le faire lui-même sans accès direct au projet Supabase). Si l'agent dispose d'un accès réseau à l'API Supabase Management ou au CLI `supabase`, il peut tenter d'appliquer la migration automatiquement ; sinon il documente cette étape manuelle clairement dans le README.

---

## Étape 3 — Logique d'import Excel (le cœur de l'app)

Crée une page `/import` avec :

1. **Composant d'upload** : un `<input type="file" accept=".xlsx,.xls,.csv">`
2. **Parsing** : au choix d'un fichier, lis-le avec `XLSX.read()` (mode `array` ou `binary`), convertis la première feuille en JSON avec `XLSX.utils.sheet_to_json()`
3. **Détection de colonnes** : ne suppose pas un ordre de colonnes fixe. Fais un mapping par nom de header insensible à la casse/accents (ex: "Fournisseur", "Supplier", "Nom entreprise" doivent tous mapper vers `company_name`). Liste des concepts à détecter : company_name, product_name, category, country, moq, quantity, price, currency, incoterm, certifications, specs, packaging, origin, contact, email, phone, website. Si une colonne ne matche aucun concept connu, ignore-la silencieusement (log dans la console).
4. **Nettoyage** : trim des espaces, normalisation de la casse pour comparaison (garder la casse d'origine pour l'affichage), suppression des lignes entièrement vides.
5. **Déduplication des fournisseurs** :
   - Normalise `company_name` (lowercase, trim, suppression ponctuation)
   - Requête Supabase pour chercher un fournisseur existant avec un nom normalisé identique ou très proche (tu peux utiliser une simple distance de Levenshtein en JS, implémente une petite fonction utilitaire — pas besoin de librairie externe)
   - Si match fort (nom quasi identique OU nom proche + un champ additionnel qui matche : pays/email/site web/téléphone) → réutilise le fournisseur existant
   - Si aucun match → crée un nouveau fournisseur
   - Si match ambigu (similarité moyenne, aucun champ additionnel de confirmation) → marque la ligne comme "à vérifier" dans l'écran de prévisualisation (étape 4), ne l'insère PAS automatiquement tant que l'utilisateur n'a pas validé
6. **Produits et offres** : pour chaque ligne, résout ou crée la catégorie, résout ou crée le produit (par nom + catégorie), puis crée une offer liant supplier_id + product_id avec toutes les infos spécifiques à cette ligne. Si une offer existe déjà pour ce couple (supplier, product), UPDATE au lieu de dupliquer (avec un avertissement listé dans le résumé d'import).

**Done quand** : uploader un fichier Excel de test (crée-en un factice de 10-15 lignes avec des doublons volontaires de fournisseurs) produit un résultat cohérent en base, sans doublons de fournisseurs pour les lignes identiques.

---

## Étape 4 — Écran de prévisualisation avant import définitif

Avant d'écrire en base, affiche un résumé :
- Nombre de nouveaux fournisseurs détectés
- Nombre de fournisseurs reconnus comme existants (avec le nom du match proposé)
- Nombre de lignes ambiguës nécessitant une validation manuelle (avec un petit UI permettant à l'utilisateur de choisir "c'est le même fournisseur" ou "c'est un nouveau fournisseur" pour chacune)
- Nombre de produits/offres qui seront créés ou mis à jour

Un bouton "Confirmer l'import" déclenche les écritures réelles en base seulement après validation.

**Done quand** : aucune écriture en base ne se produit avant que l'utilisateur ait cliqué sur "Confirmer l'import".

---

## Étape 5 — Page Fournisseurs

Route `/suppliers` :
- Liste tous les fournisseurs (nom, pays, contact, email, téléphone, site web, statut)
- Champ de recherche/filtre côté client (par nom, pays, statut)
- Clic sur un fournisseur → route `/suppliers/[id]` affichant :
  - Infos générales
  - Section "Produits proposés" listant chaque offer liée avec MOQ, quantité, prix, incoterm, certifications, specs, documents
  - Un select pour changer le statut du fournisseur, qui écrit directement en base via Supabase

**Done quand** : naviguer vers un fournisseur affiche bien tous ses produits et leurs infos spécifiques séparément.

---

## Étape 6 — Page Produits

Route `/products` :
- Liste tous les produits (nom, catégorie)
- Clic sur un produit → route `/products/[id]` affichant :
  - Caractéristiques recherchées par Soycain
  - Tableau comparatif de tous les fournisseurs proposant ce produit (prix, MOQ, quantité, incoterm, certifications, statut de qualification), triable par colonne

**Done quand** : depuis un produit on voit tous les fournisseurs qui le proposent, comparables en un coup d'œil.

---

## Étape 7 — Dashboard

Route `/` (page d'accueil) :
- Nombre total de fournisseurs
- Nombre total de produits
- Nombre de catégories
- Nombre d'offres
- Fournisseurs à vérifier / qualifiés / en attente
- Produits sans fournisseur identifié

**Done quand** : les chiffres reflètent l'état réel de la base (via des requêtes `count()` Supabase).

---

## Étape 8 — Recherche globale et filtres

Sur `/products` et `/suppliers`, ajoute des filtres combinables : catégorie, pays, certification, incoterm, statut, disponibilité. Filtrage côté client sur les données déjà chargées (pas besoin d'un moteur de recherche serveur pour un volume de quelques centaines de lignes).

---

## Étape 9 — Documents (si le temps le permet, sinon reporter)

- Upload de documents vers Supabase Storage (bucket `documents`, à créer — noter cette étape en **[ACTION HUMAINE REQUISE]** si l'agent ne peut pas créer de bucket automatiquement)
- Association d'un document à un fournisseur ou à une offer précise
- Affichage des documents sur les fiches correspondantes

---

## Étape 10 — Export Excel (si le temps le permet, sinon reporter)

Bouton "Exporter" sur `/suppliers` et `/products` qui génère un fichier `.xlsx` avec `xlsx` (`XLSX.utils.json_to_sheet` + `XLSX.writeFile`) à partir des données actuellement filtrées à l'écran.

---

## Étape 11 — Déploiement

1. Initialise un repo Git, commit tout le code (jamais `.env.local`, vérifie que `.gitignore` l'exclut)
2. **[ACTION HUMAINE REQUISE]** : pousser le repo sur GitHub (créer le repo si besoin) et l'importer sur Vercel
3. **[ACTION HUMAINE REQUISE]** : dans les Project Settings de Vercel, ajouter les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déclencher le déploiement

**Done quand** : l'URL Vercel de production charge le dashboard et affiche des données réelles après un import de test.

---

## Livrables attendus en fin de mission

- Code source complet et fonctionnel dans le repo
- `README.md` avec : instructions de setup local, liste des variables d'environnement, comment lancer un import de test, lien de déploiement une fois disponible
- `DECISIONS.md` listant tous les choix techniques pris de manière autonome et toute étape qui a nécessité un contournement
- Un fichier Excel de test factice (`test-data/sourcing-exemple.xlsx`) avec au moins un fournisseur apparaissant sur 3 lignes/produits différents et un cas de quasi-doublon (ex: "Fournisseur A" et "FOURNISSEUR A ") pour valider la déduplication

## Règles à ne jamais violer

1. Un fournisseur = une seule fiche en base, jamais de doublon silencieux
2. Les infos spécifiques à un produit (prix, MOQ, specs...) restent toujours rattachées à l'offer, jamais mélangées entre produits
3. Aucune fusion automatique de fournisseurs ambigus sans validation humaine dans l'écran de prévisualisation
4. Un nouvel import ne doit jamais écraser silencieusement des données existantes — toujours signaler avant d'écraser
