'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const BORDER_COLORS = [
  'border-t-green-500',
  'border-t-blue-500',
  'border-t-purple-500',
  'border-t-orange-500',
  'border-t-teal-500',
  'border-t-rose-500',
];

const BADGE_COLORS = [
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Chargement des catégories...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} catégorie{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/categories/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md transition-all whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle catégorie
        </Link>
      </div>

      <div className="relative mb-6 max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Effacer la recherche"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🗂️</span>
          <p className="text-gray-600 font-medium text-lg">Aucune catégorie trouvée</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? `Aucun résultat pour « ${search} »` : 'Commencez par créer une nouvelle catégorie.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-sm text-green-600 hover:text-green-700 underline underline-offset-2"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, index) => {
            const colorIndex = index % BORDER_COLORS.length;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className={`group relative bg-white border border-gray-200 border-t-4 ${BORDER_COLORS[colorIndex]} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">
                    {cat.name}
                  </h2>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400 group-hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_COLORS[colorIndex]}`}>
                    {cat.products?.length || 0} produit{(cat.products?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
