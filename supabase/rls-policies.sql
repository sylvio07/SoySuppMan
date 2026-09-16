-- ============================================================
-- SOURCIO — RLS Policies
-- À exécuter dans l'éditeur SQL Supabase APRÈS schema.sql
-- Usage interne : accès réservé aux utilisateurs authentifiés
-- ============================================================

-- ── categories ──────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_auth"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_insert_auth"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "categories_update_auth"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_delete_auth"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- ── products ────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_auth"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_insert_auth"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_auth"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_delete_auth"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ── suppliers ───────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_auth"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "suppliers_insert_auth"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "suppliers_update_auth"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "suppliers_delete_auth"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- ── offers ──────────────────────────────────────────────────
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_auth"
  ON offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "offers_insert_auth"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "offers_update_auth"
  ON offers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "offers_delete_auth"
  ON offers FOR DELETE
  TO authenticated
  USING (true);

-- ── documents ───────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_auth"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "documents_insert_auth"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "documents_update_auth"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "documents_delete_auth"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- NOTE : Si tu avais désactivé RLS manuellement (ALTER TABLE
-- ... DISABLE ROW LEVEL SECURITY) pour débloquer l'import,
-- ce script le réactive. Les policies ci-dessus remplacent
-- ce contournement : tout utilisateur authentifié a accès
-- complet en lecture et en écriture.
-- ============================================================
