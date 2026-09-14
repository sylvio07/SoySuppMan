'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/export';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCertification, setFilterCertification] = useState('');
  const [filterIncoterm, setFilterIncoterm] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*, offers(certifications, incoterm)')
        .order('company_name');
      if (!error && data) setSuppliers(data);
      setLoading(false);
    }
    load();
  }, []);

  const countries = [...new Set(suppliers.map((s) => s.country).filter(Boolean))].sort();
  const statuses = [...new Set(suppliers.map((s) => s.status).filter(Boolean))].sort();

  const allCertifications = [...new Set(
    suppliers.flatMap((s) => (s.offers || []).map((o) => o.certifications).filter(Boolean))
  )].sort();
  const allIncoterms = [...new Set(
    suppliers.flatMap((s) => (s.offers || []).map((o) => o.incoterm).filter(Boolean))
  )].sort();

  const filtered = suppliers.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        s.company_name?.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.contact_person?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterCountry && s.country !== filterCountry) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterCertification) {
      const hasCert = (s.offers || []).some((o) =>
        o.certifications?.toLowerCase().includes(filterCertification.toLowerCase())
      );
      if (!hasCert) return false;
    }
    if (filterIncoterm) {
      const hasInco = (s.offers || []).some((o) =>
        o.incoterm?.toLowerCase().includes(filterIncoterm.toLowerCase())
      );
      if (!hasInco) return false;
    }
    return true;
  });

  if (loading) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Fournisseurs</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher (nom, pays, email...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Tous les pays</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterCertification}
          onChange={(e) => setFilterCertification(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes certifications</option>
          {allCertifications.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterIncoterm}
          onChange={(e) => setFilterIncoterm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Tous incoterms</option>
          {allIncoterms.map((ic) => (
            <option key={ic} value={ic}>{ic}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">{filtered.length} fournisseur(s)</p>
        <button
          onClick={() => {
            const data = filtered.map((s) => ({
              Nom: s.company_name,
              Pays: s.country,
              Contact: s.contact_person,
              Email: s.email,
              Téléphone: s.phone,
              'Site web': s.website,
              Statut: s.status,
            }));
            exportToExcel(data, 'fournisseurs-soycain');
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
              <th className="text-left px-4 py-3 font-medium">Nom</th>
              <th className="text-left px-4 py-3 font-medium">Pays</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Téléphone</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/suppliers/${s.id}`} className="text-green-700 hover:underline font-medium">
                    {s.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.country}</td>
                <td className="px-4 py-3 text-gray-600">{s.contact_person}</td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Aucun fournisseur trouvé.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'À vérifier': 'bg-yellow-100 text-yellow-800',
    'Qualifié': 'bg-green-100 text-green-800',
    'Rejeté': 'bg-red-100 text-red-800',
    'En attente': 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || '—'}
    </span>
  );
}
