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
    <div className="max-w-3xl mx-auto">
      <Link href="/suppliers" className="text-sm text-green-700 hover:underline mb-5 inline-block">
        &larr; Retour aux fournisseurs
      </Link>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 border-b border-green-100 px-6 py-4">
          <h1 className="text-xl font-semibold text-green-900">Nouveau fournisseur</h1>
          <p className="text-sm text-green-700 mt-0.5">Les champs marqués d&apos;un <span className="font-semibold">*</span> sont obligatoires.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nom de l'entreprise" value={form.company_name} onChange={set('company_name')} required />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
              <textarea
                value={form.comments}
                onChange={set('comments')}
                rows={3}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/suppliers" className="text-sm text-gray-500 hover:text-gray-700 hover:underline text-center sm:text-left transition-colors">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto sm:min-w-[180px] inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {saving ? 'Enregistrement...' : 'Créer le fournisseur'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
      />
    </div>
  );
}
