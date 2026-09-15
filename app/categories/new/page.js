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
    <div>
      <Link href="/categories" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux catégories
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nouvelle catégorie</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nom *</label>
            <input type="text" value={form.name} onChange={set('name')} required
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Créer la catégorie'}
          </button>
          <Link href="/categories" className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
