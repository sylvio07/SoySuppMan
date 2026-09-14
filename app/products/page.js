'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/export';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), offers(id)')
        .order('name');
      if (!error && data) setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const categories = [...new Set(
    products.map((p) => p.categories?.name).filter(Boolean)
  )].sort();

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name?.toLowerCase().includes(q) &&
        !p.categories?.name?.toLowerCase().includes(q)
      ) return false;
    }
    if (filterCategory && p.categories?.name !== filterCategory) return false;
    return true;
  });

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Produits</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">{filtered.length} produit(s)</p>
        <button
          onClick={() => {
            const data = filtered.map((p) => ({
              Produit: p.name,
              Catégorie: p.categories?.name || '',
              'Nb fournisseurs': p.offers?.length || 0,
            }));
            exportToExcel(data, 'produits-soycain');
          }}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition-colors"
        >
          Exporter Excel
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Produit</th>
              <th className="text-left px-4 py-3 font-medium">Catégorie</th>
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
                <td className="px-4 py-3 text-gray-600">{p.categories?.name || '—'}</td>
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
