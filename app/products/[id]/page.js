'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState('company_name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    async function load() {
      const { data: prod } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      const { data: off } = await supabase
        .from('offers')
        .select('*, suppliers(company_name, country, status)')
        .eq('product_id', id);

      if (prod) setProduct(prod);
      if (off) setOffers(off);
      setLoading(false);
    }
    load();
  }, [id]);

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedOffers = [...offers].sort((a, b) => {
    let va, vb;
    switch (sortCol) {
      case 'company_name':
        va = a.suppliers?.company_name || '';
        vb = b.suppliers?.company_name || '';
        break;
      case 'price':
        va = a.price ?? Infinity;
        vb = b.price ?? Infinity;
        break;
      case 'moq':
        va = a.moq || '';
        vb = b.moq || '';
        break;
      case 'status':
        va = a.suppliers?.status || '';
        vb = b.suppliers?.status || '';
        break;
      default:
        va = a[sortCol] || '';
        vb = b[sortCol] || '';
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  if (loading) return <p className="text-gray-500">Chargement...</p>;
  if (!product) return <p className="text-red-500">Produit introuvable.</p>;

  return (
    <div>
      <Link href="/products" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux produits
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Catégorie : {product.categories?.name || '—'}
        </p>
        {product.description && (
          <p className="text-sm text-gray-700 mb-2">{product.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {product.specs_required && (
            <div><span className="text-gray-500">Specs requises :</span> {product.specs_required}</div>
          )}
          {product.certifications_required && (
            <div><span className="text-gray-500">Certifications requises :</span> {product.certifications_required}</div>
          )}
          {product.quality_docs_required && (
            <div><span className="text-gray-500">Documents qualité :</span> {product.quality_docs_required}</div>
          )}
          {product.packaging_required && (
            <div><span className="text-gray-500">Conditionnement requis :</span> {product.packaging_required}</div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">
        Fournisseurs ({offers.length})
      </h2>

      {offers.length === 0 ? (
        <p className="text-gray-400">Aucun fournisseur pour ce produit.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader col="company_name" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>Fournisseur</SortHeader>
                <SortHeader col="price" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>Prix</SortHeader>
                <SortHeader col="moq" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>MOQ</SortHeader>
                <th className="text-left px-4 py-3 font-medium">Quantité</th>
                <SortHeader col="incoterm" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>Incoterm</SortHeader>
                <th className="text-left px-4 py-3 font-medium">Certifications</th>
                <th className="text-left px-4 py-3 font-medium">Spécifications</th>
                <SortHeader col="status" sortCol={sortCol} sortDir={sortDir} onToggle={toggleSort}>Statut</SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/suppliers/${offer.supplier_id}`}
                      className="text-green-700 hover:underline"
                    >
                      {offer.suppliers?.company_name}
                    </Link>
                    <div className="text-xs text-gray-400">{offer.suppliers?.country}</div>
                  </td>
                  <td className="px-4 py-3">
                    {offer.price != null ? `${offer.price} ${offer.currency || ''}` : '—'}
                  </td>
                  <td className="px-4 py-3">{offer.moq || '—'}</td>
                  <td className="px-4 py-3">{offer.available_quantity || '—'}</td>
                  <td className="px-4 py-3">{offer.incoterm || '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{offer.certifications || '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{offer.technical_specs || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      offer.suppliers?.status === 'Qualifié'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {offer.suppliers?.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortHeader({ col, sortCol, sortDir, onToggle, children }) {
  return (
    <th
      className="text-left px-4 py-3 font-medium cursor-pointer hover:text-green-700 select-none"
      onClick={() => onToggle(col)}
    >
      {children}
      {sortCol === col && (
        <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  );
}
