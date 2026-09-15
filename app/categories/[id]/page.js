'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CategoryDetailPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        <h1 className="text-2xl font-bold mb-1">{category.name}</h1>
        <p className="text-sm text-gray-500">{products.length} produit(s) dans cette catégorie</p>
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
