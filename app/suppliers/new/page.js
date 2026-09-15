'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['À vérifier', 'Qualifié', 'En attente', 'Rejeté'];

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    company_name: '', supplier_type: '', country: '', city: '', address: '',
    email: '', phone: '', website: '', contact_person: '', contact_role: '',
    specialties: '', comments: '', status: 'À vérifier',
  });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('Le nom du fournisseur est requis.'); return; }
    setSaving(true);
    setError(null);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || null])
    );
    const { data, error } = await supabase.from('suppliers').insert(payload).select('id').single();
    if (error) { setError(error.message); setSaving(false); return; }
    router.push(`/suppliers/${data.id}`);
  };

  return (
    <div>
      <Link href="/suppliers" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux fournisseurs
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nouveau fournisseur</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *" value={form.company_name} onChange={set('company_name')} required />
          <Field label="Type de fournisseur" value={form.supplier_type} onChange={set('supplier_type')} />
          <Field label="Pays" value={form.country} onChange={set('country')} />
          <Field label="Ville" value={form.city} onChange={set('city')} />
          <Field label="Adresse" value={form.address} onChange={set('address')} />
          <Field label="Email" value={form.email} onChange={set('email')} type="email" />
          <Field label="Téléphone" value={form.phone} onChange={set('phone')} />
          <Field label="Site web" value={form.website} onChange={set('website')} />
          <Field label="Personne de contact" value={form.contact_person} onChange={set('contact_person')} />
          <Field label="Fonction du contact" value={form.contact_role} onChange={set('contact_role')} />
          <div className="md:col-span-2">
            <Field label="Spécialités" value={form.specialties} onChange={set('specialties')} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Statut</label>
            <select value={form.status} onChange={set('status')} className="border border-gray-300 rounded px-3 py-2 text-sm w-full">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Commentaires</label>
            <textarea value={form.comments} onChange={set('comments')} rows={3}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Créer le fournisseur'}
          </button>
          <Link href="/suppliers" className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required}
        className="border border-gray-300 rounded px-3 py-2 text-sm w-full" />
    </div>
  );
}
