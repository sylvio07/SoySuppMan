'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [suppliers, products, categories, offers] = await Promise.all([
        supabase.from('suppliers').select('id, status'),
        supabase.from('products').select('id'),
        supabase.from('categories').select('id'),
        supabase.from('offers').select('id, product_id'),
      ]);

      const supplierData = suppliers.data || [];
      const productData = products.data || [];
      const offerData = offers.data || [];

      const productIdsWithOffers = new Set(offerData.map((o) => o.product_id));
      const productsWithoutSupplier = productData.filter(
        (p) => !productIdsWithOffers.has(p.id)
      ).length;

      const statusCounts = {};
      for (const s of supplierData) {
        const status = s.status || 'À vérifier';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }

      setStats({
        totalSuppliers: supplierData.length,
        totalProducts: productData.length,
        totalCategories: (categories.data || []).length,
        totalOffers: offerData.length,
        productsWithoutSupplier,
        statusCounts,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
        <p className="text-gray-500">
          Connectez Supabase pour voir les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <DashCard label="Fournisseurs" value={stats.totalSuppliers} href="/suppliers" color="green" />
        <DashCard label="Produits" value={stats.totalProducts} href="/products" color="blue" />
        <DashCard label="Catégories" value={stats.totalCategories} color="purple" />
        <DashCard label="Offres" value={stats.totalOffers} color="teal" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Statut des fournisseurs</h2>
          {Object.entries(stats.statusCounts).length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun fournisseur.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Alertes</h2>
          {stats.productsWithoutSupplier > 0 ? (
            <div className="text-sm">
              <span className="text-yellow-600 font-medium">
                {stats.productsWithoutSupplier}
              </span>{' '}
              <span className="text-gray-600">
                produit(s) sans fournisseur identifié
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune alerte.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashCard({ label, value, href, color }) {
  const colorMap = {
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    teal: 'border-l-teal-500',
  };

  const content = (
    <div className={`bg-white border border-gray-200 border-l-4 ${colorMap[color] || ''} rounded-lg p-5`}>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block hover:shadow-md transition-shadow rounded-lg">{content}</Link>;
  }
  return content;
}
