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
| 9 — Documents | Terminé (code) | Upload/suppression/affichage implémentés sur la fiche fournisseur (niveau fournisseur et niveau offre). [ACTION HUMAINE REQUISE] Créer le bucket `documents` dans Supabase Storage (public) |
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

### Étape 9 — Documents : implémentation
Le code d'upload/suppression/affichage des documents est intégré directement dans la page fiche fournisseur (`/suppliers/[id]`), à deux niveaux :
- **Niveau fournisseur** : section « Documents du fournisseur » en haut de la fiche, pour les documents généraux (certificats d'entreprise, contrats cadre, etc.)
- **Niveau offre** : chaque carte offre affiche ses propres documents et permet d'en ajouter

Choix techniques :
- Upload vers Supabase Storage bucket `documents`, avec un chemin `{supplier_id}/{timestamp}_{filename}` pour éviter les collisions
- Noms de fichiers assainis (caractères spéciaux remplacés par `_`) pour compatibilité storage
- Types de document prédéfinis : Certificat, Fiche technique, Bon de commande, Facture, Contrat, Autre
- Suppression : supprime le fichier dans le storage ET l'enregistrement en base
- Pas de page `/documents` séparée : les documents sont toujours consultés dans le contexte de leur fournisseur/offre, ce qui est plus naturel pour le workflow

**[ACTION HUMAINE REQUISE]** : Créer un bucket `documents` dans Supabase Storage (Dashboard > Storage > New bucket). Le bucket doit être public pour que les URLs de téléchargement fonctionnent.

### Revue de qualité post-génération — corrections appliquées

1. **Export Excel crashait dans le navigateur** : `XLSX.writeFile()` utilise `fs` (Node.js). Remplacé par `XLSX.write()` + Blob + lien de téléchargement dynamique.
2. **6 colonnes CSV perdues à l'import** : `supplier_type`, `specialties`, `payment_terms`, `loading_port`, `discharge_port`, `priority` étaient mappées mais n'existaient pas en base. Colonnes ajoutées au schéma SQL et à la logique d'insert (`import-logic.js`).
3. **Limite 1000 lignes Supabase sur la dédup** : `select('*')` sans `.range()` retourne au max 1000 rows par défaut. Ajout de `.range(0, 9999)` dans `dedup.js`.
4. **`parsePrice` cassait sur les séparateurs de milliers** : `"1,234,567"` devenait `1.234`. Parsing amélioré avec détection locale (virgule décimale européenne vs. point anglo-saxon).
5. **Compteurs catégories/produits surévalués** : renommés en `categoriesResolved`/`productsResolved` pour refléter qu'ils comptent les catégories/produits uniques dans l'import (pas nécessairement nouveaux).
6. **`SortHeader` défini dans le render** : anti-pattern React causant des remontages DOM. Extrait en composant séparé dans `products/[id]/page.js`.
7. **Code mort supprimé** : import `normalizeCompanyName` et constante `STEPS` inutilisés dans `import/page.js`.
8. **`sheet_to_json` perdait 5 colonnes du CSV réel** : sans `{defval: ''}`, SheetJS supprime les colonnes vides dans les premières lignes. `CONTACT_POSITION`, `DISCHARGE PORT`, `NOTES AFTER EXCHANGES`, `TARGET_PRICE_HINT`, `PRIORITY` étaient silencieusement ignorées. Corrigé en ajoutant `{defval: ''}` au parsing.

**⚠️ IMPORTANT** : Le schéma SQL a changé (nouvelles colonnes). Si le schéma a déjà été appliqué dans Supabase, exécuter ces ALTER manuellement :
```sql
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_type text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS specialties text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS loading_port text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discharge_port text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS priority text;
```
