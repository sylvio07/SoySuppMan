'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom de la catégorie est requis.'); return; }
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: form.name.trim(), description: form.description.trim() || null })
      .select('id')
      .single();
    if (error) { setError(error.message); setSaving(false); return; }
    router.push(`/categories/${data.id}`);
  };

  return (
    <div className="max-w-lg">
      <Link href="/categories" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 hover:underline mb-6">
        &larr; Retour aux catégories
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h1 className="text-lg font-semibold text-gray-800">Nouvelle catégorie</h1>
          <p className="text-sm text-gray-500 mt-0.5">Renseignez les informations de la catégorie à créer.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="Ex. : Oléagineux / Graines"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                placeholder="Courte description de la catégorie…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-7">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Enregistrement…
                </>
              ) : 'Créer la catégorie'}
            </button>

            <Link
              href="/categories"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-5 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
