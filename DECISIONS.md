# DECISIONS.md — Suivi des décisions et avancement

## Avancement par étape

| Étape | Statut | Notes |
|-------|--------|-------|
| 0 — Prérequis | En attente | [ACTION HUMAINE REQUISE] Créer le projet Supabase + Vercel, fournir les clés dans `.env.local` |
| 1 — Initialisation du projet | Terminé | Next.js 14.2 + Tailwind + SheetJS + Supabase JS |
| 2 — Schéma de base de données | Terminé (code) | `supabase/schema.sql` créé. [ACTION HUMAINE REQUISE] Exécuter le SQL dans l'éditeur Supabase |
| 3 — Logique d'import Excel | Terminé | Parsing, mapping colonnes, déduplication, import |
| 4 — Écran de prévisualisation | Terminé | Résumé, résolution des ambiguïtés, confirmation avant écriture |
| 5 — Page Fournisseurs | Terminé | Liste filtrable + fiche détaillée avec offres |
| 6 — Page Produits | Terminé | Liste filtrable + tableau comparatif triable |
| 7 — Dashboard | Terminé | Statistiques temps réel via Supabase count() |
| 8 — Recherche et filtres | Terminé | Filtres combinables sur `/suppliers` et `/products` (catégorie, pays, statut, certifications, incoterm) |
| 9 — Documents | Reporté | Nécessite la création d'un bucket Supabase Storage [ACTION HUMAINE REQUISE] |
| 10 — Export Excel | Terminé | Boutons "Exporter Excel" sur `/suppliers` et `/products` |
| 11 — Déploiement | En attente | [ACTION HUMAINE REQUISE] Push GitHub + import Vercel + variables d'env |

## Décisions techniques

### Langage : JavaScript (pas TypeScript)
Choix de JavaScript pour simplifier le setup et accélérer le développement. Le volume de code est modéré et la complexité métier est dans la logique d'import, pas dans le typage.

### Supabase client : placeholder URL pour le build
Le client Supabase utilise une URL placeholder (`https://placeholder.supabase.co`) quand les variables d'environnement ne sont pas définies. Cela permet au build Next.js de réussir en SSG sans les vraies clés. Les requêtes échoueront silencieusement côté client tant que les vraies clés ne sont pas fournies.

### Mapping de colonnes flexible
Le mapping est fait par nom de header, insensible à la casse et aux accents (NFD normalization). Chaque concept métier a une liste d'alias couvrant les colonnes du CSV fourni et les variantes françaises/anglaises courantes. Les colonnes non reconnues sont ignorées avec un log console.

### Déduplication des fournisseurs
- Normalisation : lowercase + suppression ponctuation + trim
- Distance de Levenshtein implémentée en pur JS (pas de lib externe)
- Seuil fort : similarité ≥ 95% → match automatique
- Seuil ambigu : similarité ≥ 75% avec confirmation par champ secondaire (pays, email, site web, téléphone)
- Les doublons dans le même batch d'import sont détectés et regroupés

### Filtres côté client
Tous les filtres sont côté client (chargement complet des données puis filtrage en mémoire). Adapté au volume de quelques centaines de lignes. Filtres disponibles : recherche textuelle, pays, statut, certifications, incoterms, catégorie.

### Données de test
Fichier `test-data/sourcing-exemple.xlsx` avec 12 lignes, incluant :
- 1 fournisseur ("Agri-West Trading Co.") présent sur 4 produits dans 3 catégories différentes
- 1 quasi-doublon ("AGRI-WEST TRADING CO. " en majuscules avec espace trailing) pour tester la déduplication
- 5 fournisseurs distincts répartis sur plusieurs catégories

### Étape 9 (Documents) reportée
L'upload de documents vers Supabase Storage nécessite la création préalable d'un bucket `documents` dans le dashboard Supabase, ce qui est une action humaine. La table `documents` est prévue dans le schéma SQL, le code d'upload sera ajouté après la configuration du bucket.
