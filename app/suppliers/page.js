'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/export';

function StatusBadge({ status }) {
  const config = {
    'Qualifié':   { badge: 'bg-green-100 text-green-800 border border-green-200',  dot: 'bg-green-500' },
    'À vérifier': { badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200', dot: 'bg-yellow-400' },
    'Rejeté':     { badge: 'bg-red-100 text-red-800 border border-red-200',       dot: 'bg-red-500' },
    'En attente': { badge: 'bg-gray-100 text-gray-600 border border-gray-200',    dot: 'bg-gray-400' },
  };
  const { badge, dot } = config[status] || { badge: 'bg-gray-100 text-gray-500 border border-gray-200', dot: 'bg-gray-300' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {status || '—'}
    </span>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCertification, setFilterCertification] = useState('');
  const [filterIncoterm, setFilterIncoterm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*, offers(certifications, incoterm)')
      .order('company_name');
    if (!error && data) setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const countries = [...new Set(suppliers.map((s) => s.country).filter(Boolean))].sort();
  const statuses = [...new Set(suppliers.map((s) => s.status).filter(Boolean))].sort();
  const allCertifications = [...new Set(
    suppliers.flatMap((s) => (s.offers || []).map((o) => o.certifications).filter(Boolean))
  )].sort();
  const allIncoterms = [...new Set(
    suppliers.flatMap((s) => (s.offers || []).map((o) => o.incoterm).filter(Boolean))
  )].sort();

  const activeFiltersCount = [filterCountry, filterStatus, filterCertification, filterIncoterm].filter(Boolean).length;

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

  async function handleDelete(supplier) {
    setDeleting(true);
    await supabase.from('offers').delete().eq('supplier_id', supplier.id);
    await supabase.from('suppliers').delete().eq('id', supplier.id);
    setDeleteTarget(null);
    setDeleting(false);
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Chargement...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
        <div className="flex items-center gap-2 flex-wrap">
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
            className="text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            Exporter Excel
          </button>
          <Link
            href="/suppliers/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
          >
            + Nouveau fournisseur
          </Link>
        </div>
      </div>

      {/* Search + filter toggle row */}
      <div className="flex flex-wrap gap-3 mb-3">
        <input
          type="text"
          placeholder="Rechercher (nom, pays, email...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors font-medium ${
            filtersOpen || activeFiltersCount > 0
              ? 'border-green-500 text-green-700 bg-green-50'
              : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Filtres
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold leading-none">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible filter row */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous les pays</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterCertification}
            onChange={(e) => setFilterCertification(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Toutes certifications</option>
            {allCertifications.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterIncoterm}
            onChange={(e) => setFilterIncoterm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous incoterms</option>
            {allIncoterms.map((ic) => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setFilterCountry(''); setFilterStatus(''); setFilterCertification(''); setFilterIncoterm(''); }}
              className="sm:col-span-2 text-sm text-red-600 hover:text-red-800 px-2 py-2 transition-colors text-left"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-3">{filtered.length} fournisseur{filtered.length !== 1 ? 's' : ''}</p>

      {/* Mobile card list (hidden on md+) */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-5xl">🏭</span>
            <p className="text-gray-500 font-medium">Aucun fournisseur trouvé</p>
            <p className="text-gray-400 text-sm">
              {search || activeFiltersCount > 0
                ? 'Modifiez vos critères.'
                : <Link href="/import" className="text-green-600 hover:underline">Importer des fournisseurs</Link>
              }
            </p>
          </div>
        ) : filtered.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href={`/suppliers/${s.id}`} className="font-semibold text-green-700 hover:underline block truncate">
                {s.company_name}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                {s.country && <span>{s.country}</span>}
                {s.contact_person && <span>{s.contact_person}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={s.status} />
              <button
                onClick={() => setDeleteTarget(s)}
                title="Supprimer"
                className="text-gray-300 hover:text-red-500 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table (hidden on mobile) */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">🏭</span>
            <p className="text-gray-500 font-medium">Aucun fournisseur trouvé</p>
            <p className="text-gray-400 text-sm">
              {search || activeFiltersCount > 0
                ? 'Essayez de modifier vos critères de recherche.'
                : <>Importez des fournisseurs depuis&nbsp;<Link href="/import" className="text-green-600 hover:underline">l&apos;import Excel</Link>.</>
              }
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Pays</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Téléphone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="group hover:bg-green-50 transition-colors relative"
                  style={{ borderLeft: '3px solid transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = '#16a34a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = 'transparent'; }}
                >
                  <td className="px-4 py-3">
                    <Link href={`/suppliers/${s.id}`} className="text-green-700 hover:underline font-medium">
                      {s.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.country}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact_person}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.email ? (
                      <a href={`mailto:${s.email}`} className="hover:text-green-700 hover:underline transition-colors">
                        {s.email}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(s)}
                      title="Supprimer ce fournisseur"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 w-7 h-7 rounded flex items-center justify-center text-base leading-none"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Supprimer le fournisseur ?</h2>
            <p className="text-sm text-gray-600 mb-1">
              Vous êtes sur le point de supprimer&nbsp;
              <span className="font-semibold text-gray-800">{deleteTarget.company_name}</span>.
            </p>
            <p className="text-sm text-red-600 mb-5">
              Cette action supprimera également toutes les offres associées. Elle est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
