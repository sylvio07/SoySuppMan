# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Soycain supplier management app — import Excel/CSV files of agricultural supplier sourcing data, deduplicate suppliers, and explore via a web UI. Built for Soycain, an agri-commodity company sourcing from West Africa.

The primary spec is `soycain-codex-spec.md`. The source data is a ~285-row CSV (`soycain_products_suppliers - soycain_products_suppliers (1).csv`) with columns: SUPPLIER_NAME, CATEGORY, PRODUCT, COUNTRY, Technical Specification, CERTIFICATIONS, MOQ, INCOTERMS, PACKAGING, PRICE, etc.

## Tech Stack (Mandated — Do Not Substitute)

- **Framework**: Next.js 14+ (App Router, no `src/` directory)
- **Database**: Supabase (Postgres) — client-side JS via `@supabase/supabase-js`
- **Excel parsing**: `xlsx` (SheetJS) — client-side in-browser
- **Styling**: Tailwind CSS
- **Language**: JavaScript or TypeScript (document choice in `DECISIONS.md`)
- **Deployment**: Vercel (free tier)

## Build & Dev Commands

```bash
npm install
npm run dev          # local dev server
npm run build        # production build
npm run lint         # Next.js lint
```

## Architecture

Four Supabase tables in a relational schema (see `supabase/schema.sql`):

- **categories** — product categories (e.g., "Oilseeds / Seeds", "Plant / Spice / Botanical")
- **products** — belongs to a category; unique on (category_id, name)
- **suppliers** — company info; has a `company_name_normalized` generated column for dedup
- **offers** — the join: links one supplier to one product with pricing/MOQ/specs; unique on (supplier_id, product_id)
- **documents** — files attached to a supplier or offer (Supabase Storage)

Key routes:
- `/` — Dashboard with aggregate counts
- `/import` — Excel upload, parse, preview, confirm
- `/suppliers` and `/suppliers/[id]` — supplier list and detail
- `/products` and `/products/[id]` — product list with comparative supplier table

## Critical Business Rules

1. **One supplier = one record** — never create silent duplicates. Deduplicate on normalized company name + secondary fields (country, email, website, phone).
2. **Offer-level isolation** — price, MOQ, specs, certifications belong to the offer, never mixed across products.
3. **No automatic merge of ambiguous suppliers** — if dedup match is uncertain, flag it in the preview UI for human decision.
4. **No silent overwrites** — re-importing must warn before updating existing data.
5. **Preview before write** — all imports go through a confirmation screen; no DB writes until the user clicks "Confirm".

## Import Logic (Core Feature)

The import pipeline in `/import`:
1. Parse file with SheetJS (`XLSX.read` → `sheet_to_json`)
2. Map columns by header name (case/accent insensitive) — not by position
3. Clean: trim, normalize casing for comparison (preserve original for display), drop empty rows
4. Deduplicate suppliers: normalize name → query Supabase for near-matches (Levenshtein in JS, no external lib) → auto-match strong hits, flag ambiguous ones for human review
5. Resolve/create categories and products
6. Create or update offers (upsert on supplier_id + product_id)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Stored in `.env.local` (never committed). Template in `.env.local.example`.

## Key Conventions

- All autonomous technical decisions must be logged in `DECISIONS.md` at the project root.
- The app language is **French** for all UI text (labels, statuses like "À vérifier", buttons).
- Filtering is client-side (data volume is a few hundred rows).
- The Supabase schema must be applied manually via the Supabase SQL Editor — document this in the README.
