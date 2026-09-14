import { supabase } from './supabase';

export async function resolveCategory(name) {
  if (!name) return null;
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from('categories')
    .select('id, name')
    .eq('name', trimmed)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ name: trimmed })
    .select('id, name')
    .single();

  if (error) throw new Error(`Erreur création catégorie "${trimmed}": ${error.message}`);
  return created;
}

export async function resolveProduct(name, categoryId) {
  if (!name) return null;
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from('products')
    .select('id, name, category_id')
    .eq('name', trimmed)
    .eq('category_id', categoryId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('products')
    .insert({ name: trimmed, category_id: categoryId })
    .select('id, name, category_id')
    .single();

  if (error) throw new Error(`Erreur création produit "${trimmed}": ${error.message}`);
  return created;
}

function parsePrice(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/[^0-9.,\-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function executeImport(resolvedRows) {
  const summary = {
    suppliersCreated: 0,
    suppliersReused: 0,
    categoriesCreated: 0,
    productsCreated: 0,
    offersCreated: 0,
    offersUpdated: 0,
    errors: [],
  };

  const categoryCache = new Map();
  const productCache = new Map();
  const supplierCache = new Map();

  for (const item of resolvedRows) {
    try {
      const { row, matchType, existingSupplier, userDecision } = item;

      if (matchType === 'ambiguous' && userDecision === 'skip') continue;

      let supplierId;
      const normKey = (row.company_name || '').toLowerCase().trim();

      if (supplierCache.has(normKey)) {
        supplierId = supplierCache.get(normKey);
        summary.suppliersReused++;
      } else if (
        matchType === 'strong' ||
        matchType === 'batch_duplicate' ||
        (matchType === 'ambiguous' && userDecision === 'existing')
      ) {
        if (existingSupplier) {
          supplierId = existingSupplier.id;
          summary.suppliersReused++;
        } else if (matchType === 'batch_duplicate') {
          const batchRef = resolvedRows[item.batchIndex];
          if (batchRef && batchRef._supplierId) {
            supplierId = batchRef._supplierId;
            summary.suppliersReused++;
          }
        }
      }

      if (!supplierId) {
        const { data: newSupplier, error } = await supabase
          .from('suppliers')
          .insert({
            company_name: row.company_name,
            country: row.country || null,
            city: row.city || null,
            address: row.address || null,
            website: row.website || null,
            phone: row.phone || null,
            email: row.email || null,
            contact_person: row.contact_person || null,
            contact_role: row.contact_role || null,
            comments: row.comments || null,
          })
          .select('id')
          .single();

        if (error) {
          summary.errors.push(`Fournisseur "${row.company_name}": ${error.message}`);
          continue;
        }
        supplierId = newSupplier.id;
        summary.suppliersCreated++;
      }

      supplierCache.set(normKey, supplierId);
      item._supplierId = supplierId;

      let categoryId = null;
      if (row.category) {
        if (categoryCache.has(row.category)) {
          categoryId = categoryCache.get(row.category);
        } else {
          const cat = await resolveCategory(row.category);
          categoryId = cat.id;
          categoryCache.set(row.category, categoryId);
          summary.categoriesCreated++;
        }
      }

      let productId = null;
      if (row.product_name && categoryId) {
        const prodKey = `${categoryId}:${row.product_name}`;
        if (productCache.has(prodKey)) {
          productId = productCache.get(prodKey);
        } else {
          const prod = await resolveProduct(row.product_name, categoryId);
          productId = prod.id;
          productCache.set(prodKey, productId);
          summary.productsCreated++;
        }
      }

      if (supplierId && productId) {
        const offerData = {
          supplier_id: supplierId,
          product_id: productId,
          moq: row.moq || null,
          available_quantity: row.available_quantity || null,
          technical_specs: row.specs || null,
          certifications: row.certifications || null,
          price: parsePrice(row.price),
          currency: row.currency || null,
          incoterm: row.incoterm || null,
          origin: row.origin || null,
          packaging: row.packaging || null,
          comments: row.comments || null,
        };

        const { data: existingOffer } = await supabase
          .from('offers')
          .select('id')
          .eq('supplier_id', supplierId)
          .eq('product_id', productId)
          .single();

        if (existingOffer) {
          const { error } = await supabase
            .from('offers')
            .update(offerData)
            .eq('id', existingOffer.id);

          if (error) {
            summary.errors.push(`Offre mise à jour (${row.company_name} / ${row.product_name}): ${error.message}`);
          } else {
            summary.offersUpdated++;
          }
        } else {
          const { error } = await supabase
            .from('offers')
            .insert(offerData);

          if (error) {
            summary.errors.push(`Offre créée (${row.company_name} / ${row.product_name}): ${error.message}`);
          } else {
            summary.offersCreated++;
          }
        }
      }
    } catch (err) {
      summary.errors.push(err.message);
    }
  }

  return summary;
}
