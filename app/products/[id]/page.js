'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState('company_name');
  const [sortDir, setSortDir] = useState('asc');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: prod } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      const { data: off } = await supabase
        .from('offers')
        .select('*, suppliers(id, company_name, country, status)')
        .eq('product_id', id);

      const { data: cats } = await supabase.from('categories').select('id, name').order('name');
      if (prod) setProduct(prod);
      if (off) setOffers(off);
      if (cats) setCategories(cats);
      setLoading(false);
    }
    load();
  }, [id]);

  const startEdit = () => {
    setEditForm({ name: product.name, category_id: product.category_id, description: product.description || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('products').update({
      name: editForm.name.trim(),
      category_id: editForm.category_id,
      description: editForm.description.trim() || null,
    }).eq('id', id);
    if (!error) {
      const cat = categories.find((c) => c.id === editForm.category_id);
      setProduct((prev) => ({ ...prev, name: editForm.name.trim(), category_id: editForm.category_id, description: editForm.description.trim() || null, categories: cat ? { name: cat.name } : prev.categories }));
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer le produit "${product.name}" et toutes ses offres ?`)) return;
    setDeleting(true);
    await supabase.from('products').delete().eq('id', id);
    router.push('/products');
  };

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedOffers = [...offers].sort((a, b) => {
    let va, vb;
    switch (sortCol) {
      case 'company_name':
        va = a.suppliers?.company_name || '';
        vb = b.suppliers?.company_name || '';
        break;
      case 'price':
        va = a.price ?? Infinity;
        vb = b.price ?? Infinity;
        break;
      case 'moq':
        va = a.moq || '';
        vb = b.moq || '';
        break;
      case 'status':
        va = a.suppliers?.status || '';
        vb = b.suppliers?.status || '';
        break;
      default:
        va = a[sortCol] || '';
        vb = b[sortCol] || '';
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Chargement...</div>
    </div>
  );
  if (!product) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-red-500 text-sm">Produit introuvable.</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/products" className="hover:text-green-700 transition-colors">
          Produits
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {/* Title + actions row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            {product.categories?.name && (
              <Link href={`/categories/${product.category_id}`}>
                <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors cursor-pointer">
                  {product.categories.name}
                </span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>

        {/* Product info grid */}
        {!editing && (
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Informations produit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoField icon="🗂️" label="Catégorie" value={product.categories?.name} />
              <InfoField icon="📝" label="Description" value={product.description} wide />
              <InfoField icon="🔬" label="Spécifications requises" value={product.specs_required} />
              <InfoField icon="🏅" label="Certifications requises" value={product.certifications_required} />
              <InfoField icon="📋" label="Documents qualité" value={product.quality_docs_required} />
              <InfoField icon="📦" label="Conditionnement requis" value={product.packaging_required} />
            </div>
            {/* Aggregate origins from offers */}
            {(() => {
              const origins = [...new Set(offers.map((o) => o.origin).filter(Boolean))];
              return origins.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Origines proposées</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {origins.map((o) => (
                      <span key={o} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{o}</span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Inline edit form */}
        {editing && (
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Modifier le produit</p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Nom *</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Catégorie *</label>
              <select
                value={editForm.category_id}
                onChange={(e) => setEditForm((p) => ({ ...p, category_id: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-white"
              >
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparative table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Fournisseurs
          <span className="ml-2 text-sm font-normal text-gray-500">({offers.length})</span>
        </h2>

        {offers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
            Aucun fournisseur pour ce produit.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <SortHeader col="company_name" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort} sticky>
                      Fournisseur
                    </SortHeader>
                    <SortHeader col="price" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>
                      Prix
                    </SortHeader>
                    <SortHeader col="moq" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>
                      MOQ
                    </SortHeader>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      Quantité dispo.
                    </th>
                    <SortHeader col="incoterm" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>
                      Incoterm
                    </SortHeader>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      Certifications
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      Spécifications
                    </th>
                    <SortHeader col="status" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>
                      Statut
                    </SortHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOffers.map((offer, idx) => (
                    <tr
                      key={offer.id}
                      className={`hover:bg-green-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      {/* Sticky supplier name column */}
                      <td className="px-4 py-3 sticky left-0 z-10 bg-inherit whitespace-nowrap">
                        <Link
                          href={`/suppliers/${offer.supplier_id}`}
                          className="font-medium text-green-700 hover:text-green-900 hover:underline transition-colors"
                        >
                          {offer.suppliers?.company_name}
                        </Link>
                        {offer.suppliers?.country && (
                          <div className="text-xs text-gray-400 mt-0.5">{offer.suppliers.country}</div>
                        )}
                      </td>
                      {/* Price: bold if available */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {offer.price != null ? (
                          <span className="font-bold text-gray-900">
                            {offer.price} {offer.currency || ''}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {offer.moq ? <span className="text-gray-700">{offer.moq}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {offer.available_quantity ? <span className="text-gray-700">{offer.available_quantity}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {offer.incoterm ? <span className="text-gray-700 font-mono text-xs uppercase">{offer.incoterm}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-gray-600">
                        {offer.certifications || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-gray-600">
                        {offer.technical_specs || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={offer.suppliers?.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ icon, label, value, wide }) {
  if (!value) return null;
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <dt className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
        <span>{icon}</span>
        {label}
      </dt>
      <dd className="text-sm text-gray-800 leading-relaxed">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-gray-300">—</span>;

  const config = {
    'Qualifié': { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-200' },
    'À vérifier': { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'Rejeté': { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200' },
  };

  const style = config[status] ?? { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {status}
    </span>
  );
}

function SortHeader({ col, sortCol, sortDir, onToggle, children, sticky }) {
  const isActive = sortCol === col;
  return (
    <th
      className={`text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none whitespace-nowrap hover:text-green-700 hover:bg-green-50 transition-colors ${sticky ? 'sticky left-0 z-20 bg-gray-50' : ''}`}
      onClick={() => onToggle(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className={`inline-flex flex-col leading-none transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}>
          <svg
            className={`w-2.5 h-2.5 -mb-0.5 ${isActive && sortDir === 'asc' ? 'text-green-600' : 'text-gray-400'}`}
            viewBox="0 0 10 6" fill="currentColor"
          >
            <path d="M5 0L10 6H0z" />
          </svg>
          <svg
            className={`w-2.5 h-2.5 ${isActive && sortDir === 'desc' ? 'text-green-600' : 'text-gray-400'}`}
            viewBox="0 0 10 6" fill="currentColor"
          >
            <path d="M5 6L0 0h10z" />
          </svg>
        </span>
      </span>
    </th>
  );
}
