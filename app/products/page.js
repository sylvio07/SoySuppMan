'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/export';

// Deterministic color palette for category badges based on name hash
const CATEGORY_COLORS = [
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
  'bg-cyan-100 text-cyan-800',
];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        <svg className="animate-spin h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Chargement...
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const data = filtered.map((p) => ({
                Produit: p.name,
                Catégorie: p.categories?.name || '',
                'Nb fournisseurs': p.offers?.length || 0,
              }));
              exportToExcel(data, 'produits-soycain');
            }}
            className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Exporter Excel
          </button>
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            + Nouveau produit
          </Link>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none select-none text-base">
            🔍
          </span>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category pill filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilterCategory('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              filterCategory === ''
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
            }`}
          >
            Toutes
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filterCategory === c
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-gray-400 mb-3">
        {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
        {filterCategory && (
          <span className="ml-1">
            dans <span className="font-medium text-gray-600">{filterCategory}</span>
          </span>
        )}
      </p>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-base font-medium text-gray-500 mb-1">Aucun produit trouvé</p>
            {search || filterCategory ? (
              <p className="text-sm text-gray-400">Essayez de modifier vos filtres.</p>
            ) : (
              <p className="text-sm text-gray-400">
                Commencez par{' '}
                <Link href="/import" className="text-green-600 hover:underline font-medium">
                  importer des données
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide text-xs">Produit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide text-xs">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide text-xs">Fournisseurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const catName = p.categories?.name;
                const colorClass = catName ? hashColor(catName) : 'bg-gray-100 text-gray-600';
                const supplierCount = p.offers?.length || 0;
                return (
                  <tr key={p.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/products/${p.id}`} className="text-green-700 hover:underline font-medium">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {catName ? (
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}>
                          {catName}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        supplierCount > 0 ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {supplierCount} fournisseur{supplierCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
