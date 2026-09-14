'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['À vérifier', 'Qualifié', 'En attente', 'Rejeté'];

export default function SupplierDetailPage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      const { data: off } = await supabase
        .from('offers')
        .select('*, products(name, category_id, categories:category_id(name))')
        .eq('supplier_id', id);

      if (sup) setSupplier(sup);
      if (off) setOffers(off);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setSupplier((prev) => ({ ...prev, status: newStatus }));
    }
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;
  if (!supplier) return <p className="text-red-500">Fournisseur introuvable.</p>;

  return (
    <div>
      <Link href="/suppliers" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux fournisseurs
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{supplier.company_name}</h1>
          <select
            value={supplier.status || 'À vérifier'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Pays" value={supplier.country} />
          <InfoRow label="Ville" value={supplier.city} />
          <InfoRow label="Adresse" value={supplier.address} />
          <InfoRow label="Contact" value={supplier.contact_person} />
          <InfoRow label="Fonction" value={supplier.contact_role} />
          <InfoRow label="Email" value={supplier.email} />
          <InfoRow label="Téléphone" value={supplier.phone} />
          <InfoRow label="Site web" value={supplier.website} link />
          <InfoRow label="Commentaires" value={supplier.comments} />
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">
        Produits proposés ({offers.length})
      </h2>

      {offers.length === 0 ? (
        <p className="text-gray-400">Aucun produit lié à ce fournisseur.</p>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">
                    {offer.products?.name || 'Produit inconnu'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {offer.products?.categories?.name || '—'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  offer.status === 'Qualifié'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <InfoRow label="MOQ" value={offer.moq} />
                <InfoRow label="Quantité dispo." value={offer.available_quantity} />
                <InfoRow label="Prix" value={offer.price ? `${offer.price} ${offer.currency || ''}` : null} />
                <InfoRow label="Incoterm" value={offer.incoterm} />
                <InfoRow label="Origine" value={offer.origin} />
                <InfoRow label="Conditionnement" value={offer.packaging} />
                <InfoRow label="Certifications" value={offer.certifications} />
                <InfoRow label="Spécifications" value={offer.technical_specs} />
                <InfoRow label="Commentaires" value={offer.comments} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, link }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-500">{label} : </span>
      {link ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </div>
  );
}
