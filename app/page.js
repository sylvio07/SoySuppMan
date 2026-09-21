'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon from './components/Icon';

const indicators = [
  { label: 'Fournisseurs', key: 'suppliers', icon: 'users', href: '/suppliers', tone: 'olive' },
  { label: 'Produits', key: 'products', icon: 'leaf', href: '/products', tone: 'wheat' },
  { label: 'Catégories', key: 'categories', icon: 'layers', href: '/categories', tone: 'clay' },
  { label: 'Offres', key: 'offers', icon: 'box', tone: 'sage' },
];
const statusColors = {
  'Qualifié': '#5f8446', 'À vérifier': '#c5994e', 'Rejeté': '#b96d58',
  'En attente': '#8e9b82', Actif: '#5f8446', Inactif: '#8e9b82', Bloqué: '#b96d58',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(false);
      try {
        const results = await Promise.all([
          supabase.from('suppliers').select('id, status'),
          supabase.from('products').select('id'),
          supabase.from('categories').select('id'),
          supabase.from('offers').select('id, product_id'),
        ]);
        if (results.some((result) => result.error)) throw new Error('Chargement impossible');
        const [suppliers, products, categories, offers] = results.map((result) => result.data || []);
        const covered = new Set(offers.map((offer) => offer.product_id));
        const statuses = {};
        suppliers.forEach((supplier) => {
          const status = supplier.status || 'À vérifier';
          statuses[status] = (statuses[status] || 0) + 1;
        });
        if (!cancelled) setStats({
          suppliers: suppliers.length, products: products.length,
          categories: categories.length, offers: offers.length, statuses,
          uncovered: products.filter((product) => !covered.has(product.id)).length,
        });
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [attempt]);

  return (
    <div className="space-y-8">
      <section className="dashboard-hero hero-glow">
        <Image src="/soycain-agro-hero.png" alt="Champs de soja et graines récoltées à la lumière du soir" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 1300px" />
        <div className="dashboard-hero-shade" />
        <div className="dashboard-hero-copy">
          <p className="eyebrow"><Icon name="leaf" size={16} /> L’ORIGINE DES BELLES CONNEXIONS</p>
          <h1>Un sourcing ancré<br />dans <em>le vivant.</em></h1>
          <p>Des matières premières aux partenaires de confiance.<br className="hidden sm:block" /> Tout votre écosystème, dans un même espace.</p>
          <div className="hero-actions">
            <Link href="/suppliers">Explorer le réseau <Icon name="arrow" size={17} /></Link>
            <a href="#overview" className="hero-secondary">Votre activité <Icon name="arrow" size={15} className="rotate-90" /></a>
          </div>
        </div>
        <div className="hero-origin" aria-hidden="true"><Icon name="leaf" size={25} /><div>La richesse de nos origines<span>SOJA · SÉSAME · FILIÈRES VÉGÉTALES</span></div></div>
      </section>

      <div id="overview" className="flex items-end justify-between gap-4 scroll-mt-28">
        <div><p className="eyebrow mb-2">LE POULS DE VOTRE ACTIVITÉ</p><h2 className="text-2xl font-medium tracking-tight text-gray-900">Votre sourcing, en perspective.</h2></div>
        <Link href="/import" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-green-700 text-white text-sm font-medium px-4 py-3 hover:bg-green-800 transition-colors"><Icon name="upload" size={16} /> Nouvel import</Link>
      </div>
      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex flex-wrap gap-3 items-center justify-between"><span>Les indicateurs sont momentanément indisponibles.</span><button className="font-semibold underline underline-offset-4" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-busy={!stats && !error}>
        {indicators.map((indicator, index) => <StatCard key={indicator.key} indicator={indicator} value={stats?.[indicator.key]} index={index} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
          <div className="panel-heading"><div><p className="eyebrow">VOTRE RÉSEAU</p><h2>La qualification, en un regard.</h2></div><Icon name="shield" size={23} /></div>
          {!stats ? <p className="text-sm text-gray-500 py-6">{error ? 'Données indisponibles.' : 'Chargement des statuts…'}</p> : stats.suppliers === 0 ? <div className="py-6 text-sm text-gray-500"><p>Votre réseau commence ici.</p><Link href="/import" className="inline-flex items-center gap-2 mt-3 text-green-700 font-medium">Importer vos premiers fournisseurs <Icon name="arrow" size={15} /></Link></div> : <div className="space-y-5">{Object.entries(stats.statuses).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">{status}</span><span className="font-medium text-gray-900">{count} <span className="text-gray-500 font-normal text-xs ml-2">{Math.round(count / stats.suppliers * 100)} %</span></span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${count / stats.suppliers * 100}%`, background: statusColors[status] || '#8e9b82' }} /></div>
            </div>
          ))}</div>}
        </section>
        <section className="attention-panel">
          <div className="panel-heading"><div><p className="eyebrow">VOS PRIORITÉS</p><h2>Un catalogue bien entouré.</h2></div><Icon name="search" size={22} /></div>
          <div className="attention-count">{stats ? stats.uncovered : '—'}<span>produit{stats?.uncovered === 1 ? '' : 's'} sans fournisseur</span></div>
          <p className="text-sm leading-relaxed text-[#716347] mt-4">{!stats ? 'La couverture de votre catalogue apparaîtra après le chargement des données.' : stats.products === 0 ? 'Ajoutez vos premiers produits pour commencer à construire votre catalogue.' : stats.uncovered > 0 ? 'Complétez vos sources pour ouvrir de nouvelles possibilités d’approvisionnement.' : 'Chaque produit est associé à au moins un fournisseur.'}</p>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[#695127] mt-6">Consulter le catalogue <Icon name="arrow" size={15} /></Link>
        </section>
      </div>

      <section>
        <p className="eyebrow mb-2">PASSER À L’ACTION</p><h2 className="text-xl font-medium text-gray-900 tracking-tight mb-5">À chaque besoin, le bon chemin.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickCard href="/import" icon="upload" index="01" title="Enrichir votre base" text="Intégrez vos fichiers Excel et CSV, avec une vérification avant chaque import." />
          <QuickCard href="/suppliers" icon="users" index="02" title="Rencontrer vos partenaires" text="Retrouvez les coordonnées, les offres et les qualifications de votre réseau." />
          <QuickCard href="/products" icon="leaf" index="03" title="Explorer les possibilités" text="Parcourez les matières premières et comparez les offres par produit." />
        </div>
      </section>
    </div>
  );
}

function StatCard({ indicator, value, index }) {
  const content = <div className={`stat-card soft-card tone-${indicator.tone}`}>
    <div className="flex items-center justify-between"><span className="stat-icon"><Icon name={indicator.icon} size={21} /></span><span className="text-[10px] tracking-widest text-gray-400">0{index + 1}</span></div>
    <p className="stat-number">{value ?? '—'}</p>
    <div className="flex items-center justify-between gap-2"><span className="text-sm text-gray-600">{indicator.label}</span>{indicator.href && <Icon name="arrow" size={15} className="text-gray-400" />}</div>
  </div>;
  return indicator.href ? <Link href={indicator.href} aria-label={`Consulter les ${indicator.label.toLowerCase()}`}>{content}</Link> : content;
}

function QuickCard({ href, icon, index, title, text }) {
  return <Link href={href} className="quick-card soft-card group">
    <div className="flex items-center justify-between"><Icon name={icon} size={23} /><span className="text-[11px] text-gray-400 tracking-widest">{index}</span></div>
    <h3>{title}</h3><p>{text}</p><span className="inline-flex items-center gap-2 text-xs font-medium mt-5">Découvrir <Icon name="arrow" size={14} className="group-hover:translate-x-1 transition-transform" /></span>
  </Link>;
}
