'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      const { data: prods } = await supabase
        .from('products')
        .select('*, offers(id)')
        .eq('category_id', id)
        .order('name');

      if (cat) setCategory(cat);
      if (prods) setProducts(prods);
      setLoading(false);
    }
    load();
  }, [id]);

  const startEdit = () => {
    setEditForm({ name: category.name, description: category.description || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').update({
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
    }).eq('id', id);
    if (!error) {
      setCategory((prev) => ({ ...prev, name: editForm.name.trim(), description: editForm.description.trim() || null }));
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (products.length > 0) {
      alert(`Impossible de supprimer : cette catégorie contient ${products.length} produit(s). Supprimez d'abord les produits.`);
      return;
    }
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return;
    setDeleting(true);
    await supabase.from('categories').delete().eq('id', id);
    router.push('/categories');
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Chargement...</div>
    </div>
  );
  if (!category) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-red-500 text-sm">Catégorie introuvable.</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/categories" className="hover:text-green-700 transition-colors">
          Catégories
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium truncate">{category.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            {!editing && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{category.name}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                    {products.length} produit{products.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{category.description}</p>
                )}
              </>
            )}
          </div>

          {!editing && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                Modifier
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Supprimer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Inline edit form */}
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Modifier la catégorie</h1>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                placeholder="Nom de la catégorie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow resize-none"
                placeholder="Description optionnelle..."
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Enregistrement...
                  </>
                ) : 'Enregistrer'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
          />
        </div>
        {search && (
          <span className="text-sm text-gray-500">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Products table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Produit</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Fournisseurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-green-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-green-700 hover:text-green-900 hover:underline underline-offset-2 transition-colors"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors">
                      {p.offers?.length || 0} fournisseur{(p.offers?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3" role="img" aria-label="Boite">📦</span>
            <p className="text-gray-700 font-medium mb-1">
              {search ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit dans cette catégorie.'}
            </p>
            <p className="text-sm text-gray-400">
              {search ? 'Essayez un autre terme de recherche.' : 'Importez des données pour commencer.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
