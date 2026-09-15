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
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Tableau de bord</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 border-l-4 border-l-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-9 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">
          Connectez Supabase pour voir les statistiques.
        </p>
      </div>
    );
  }

  const totalSuppliers = stats.totalSuppliers || 0;
  const statusEntries = Object.entries(stats.statusCounts);

  const statusColorMap = {
    'Actif': 'bg-green-500',
    'Inactif': 'bg-gray-400',
    'À vérifier': 'bg-yellow-400',
    'Bloqué': 'bg-red-500',
    'En attente': 'bg-blue-400',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Tableau de bord</h1>
      <p className="text-sm text-gray-500 mb-7">Vue d&apos;ensemble de votre base fournisseurs</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Fournisseurs" value={stats.totalSuppliers} href="/suppliers" color="green" />
        <StatCard label="Produits" value={stats.totalProducts} href="/products" color="blue" />
        <StatCard label="Catégories" value={stats.totalCategories} color="purple" />
        <StatCard label="Offres" value={stats.totalOffers} color="teal" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Statut des fournisseurs</h2>
          {statusEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun fournisseur.</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const pct = totalSuppliers > 0 ? Math.round((count / totalSuppliers) * 100) : 0;
                const barColor = statusColorMap[status] || 'bg-indigo-400';
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">{status}</span>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Alertes</h2>
          {stats.productsWithoutSupplier > 0 ? (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-yellow-700">{stats.productsWithoutSupplier}</span>{' '}
                produit(s) sans fournisseur identifié
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">Aucune alerte — tout est en ordre.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="font-semibold text-gray-800 mb-4">Raccourcis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickCard
          href="/import"
          title="Importer des données"
          description="Chargez un fichier Excel ou CSV pour ajouter ou mettre à jour des fournisseurs."
          color="blue"
        />
        <QuickCard
          href="/suppliers"
          title="Voir les fournisseurs"
          description="Parcourez la liste complète des fournisseurs et consultez leurs détails."
          color="green"
        />
        <QuickCard
          href="/products"
          title="Explorer les produits"
          description="Comparez les offres par produit et identifiez les meilleures sources."
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, href, color }) {
  const borderColorMap = {
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    teal: 'border-l-teal-500',
  };

  const content = (
    <div className={`bg-white border border-gray-200 border-l-4 ${borderColorMap[color] || ''} rounded-lg p-5 h-full`}>
      <div className="text-4xl font-bold text-gray-900 tracking-tight">{value}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm text-gray-500">{label}</span>
        {href && <span className="text-gray-400 text-sm">→</span>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:shadow-md transition-shadow duration-200 rounded-lg">
        {content}
      </Link>
    );
  }
  return <div className="rounded-lg">{content}</div>;
}

function QuickCard({ href, title, description, color }) {
  const accentMap = {
    blue: 'border-l-blue-500 hover:border-l-blue-600',
    green: 'border-l-green-500 hover:border-l-green-600',
    purple: 'border-l-purple-500 hover:border-l-purple-600',
  };

  return (
    <Link
      href={href}
      className={`block bg-white border border-gray-200 border-l-4 ${accentMap[color] || 'border-l-gray-400'} rounded-lg p-5 hover:shadow-md transition-shadow duration-200 group`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-800 group-hover:text-gray-900">{title}</span>
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors duration-150">→</span>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
