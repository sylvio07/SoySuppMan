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

  if (loading) return <p className="text-gray-500">Chargement...</p>;
  if (!category) return <p className="text-red-500">Catégorie introuvable.</p>;

  return (
    <div>
      <Link href="/categories" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux catégories
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} produit(s) dans cette catégorie</p>
            {category.description && !editing && (
              <p className="text-sm text-gray-600 mt-2">{category.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={startEdit}
              className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors">
              Modifier
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="border border-red-300 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
              {deleting ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>
        {editing && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Nom *</label>
              <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button onClick={() => setEditing(false)}
                className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 max-w-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Produit</th>
              <th className="text-left px-4 py-3 font-medium">Fournisseurs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="text-green-700 hover:underline font-medium">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.offers?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  );
}
