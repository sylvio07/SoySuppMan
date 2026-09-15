'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('name');
      if (!error && data) setCategories(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Catégories</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 max-w-sm"
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} catégorie(s)</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-green-400 hover:shadow-sm transition-all group"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-green-700 mb-1">
              {cat.name}
            </h2>
            <p className="text-sm text-gray-500">
              {cat.products?.length || 0} produit(s)
            </p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-400 col-span-3 py-8 text-center">Aucune catégorie trouvée.</p>
        )}
      </div>
    </div>
  );
}
