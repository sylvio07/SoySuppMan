'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon from './components/Icon';
import { WorldMap, StatusDonut, TopCountriesChart, CategoryChart } from './components/DashboardCharts';

const indicators = [
  { label: 'Fournisseurs', key: 'suppliers', icon: 'users', href: '/suppliers', tone: 'olive' },
  { label: 'Produits', key: 'products', icon: 'leaf', href: '/products', tone: 'wheat' },
  { label: 'Catégories', key: 'categories', icon: 'layers', href: '/categories', tone: 'clay' },
  { label: 'Offres', key: 'offers', icon: 'box', tone: 'sage' },
];

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
          supabase.from('suppliers').select('id, status, country'),
          supabase.from('products').select('id, category_id'),
          supabase.from('categories').select('id, name'),
          supabase.from('offers').select('id, product_id, supplier_id, price, currency, incoterm, certifications'),
        ]);
        if (results.some((r) => r.error)) throw new Error('Chargement impossible');
        const [suppliers, products, categories, offers] = results.map((r) => r.data || []);

        const covered = new Set(offers.map((o) => o.product_id));
        const statuses = {};
        const countryCounts = {};
        suppliers.forEach((s) => {
          const status = s.status || 'À vérifier';
          statuses[status] = (statuses[status] || 0) + 1;
          if (s.country) {
            const c = s.country.trim();
            if (c) countryCounts[c] = (countryCounts[c] || 0) + 1;
          }
        });

        const catMap = {};
        categories.forEach((c) => { catMap[c.id] = c.name; });
        const catCounts = {};
        products.forEach((p) => {
          const name = catMap[p.category_id] || 'Sans catégorie';
          catCounts[name] = (catCounts[name] || 0) + 1;
        });

        if (!cancelled) setStats({
          suppliers: suppliers.length,
          products: products.length,
          categories: categories.length,
          offers: offers.length,
          statuses,
          uncovered: products.filter((p) => !covered.has(p.id)).length,
          countryCounts,
          catCounts,
        });
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [attempt]);

  const topCountries = useMemo(() => {
    if (!stats?.countryCounts) return [];
    return Object.entries(stats.countryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats]);

  const catData = useMemo(() => {
    if (!stats?.catCounts) return [];
    return Object.entries(stats.catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  return (
    <div className="space-y-8">
      <section className="dashboard-hero hero-glow">
        <Image src="/soycain-agro-hero.png" alt="Champs de soja et graines récoltées à la lumière du soir" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 1300px" />
        <div className="dashboard-hero-shade" />
        <div className="dashboard-hero-copy">
          <p className="eyebrow"><Icon name="leaf" size={16} /> L&apos;ORIGINE DES BELLES CONNEXIONS</p>
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
      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex flex-wrap gap-3 items-center justify-between"><span>Les indicateurs sont momentanément indisponibles.</span><button className="font-semibold underline underline-offset-4" onClick={() => setAttempt((v) => v + 1)}>Réessayer</button></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-busy={!stats && !error}>
        {indicators.map((indicator, index) => <StatCard key={indicator.key} indicator={indicator} value={stats?.[indicator.key]} index={index} />)}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <StatusDonut statuses={stats.statuses} total={stats.suppliers} />
            <section className="attention-panel">
              <div className="panel-heading"><div><p className="eyebrow">VOS PRIORITÉS</p><h2>Un catalogue bien entouré.</h2></div><Icon name="search" size={22} /></div>
              <div className="attention-count">{stats.uncovered}<span>produit{stats.uncovered === 1 ? '' : 's'} sans fournisseur</span></div>
              <p className="text-sm leading-relaxed text-[#716347] mt-4">{stats.products === 0 ? 'Ajoutez vos premiers produits pour commencer à construire votre catalogue.' : stats.uncovered > 0 ? 'Complétez vos sources pour ouvrir de nouvelles possibilités d’approvisionnement.' : 'Chaque produit est associé à au moins un fournisseur.'}</p>
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[#695127] mt-6">Consulter le catalogue <Icon name="arrow" size={15} /></Link>
            </section>
          </div>

          <WorldMap countryCounts={stats.countryCounts} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TopCountriesChart data={topCountries} />
            <CategoryChart data={catData} />
          </div>
        </>
      )}

      {!stats && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
            <div className="panel-heading"><div><p className="eyebrow">VOTRE RÉSEAU</p><h2>La qualification, en un regard.</h2></div><Icon name="shield" size={23} /></div>
            <p className="text-sm text-gray-500 py-6">Chargement des statuts…</p>
          </section>
          <section className="attention-panel">
            <div className="panel-heading"><div><p className="eyebrow">VOS PRIORITÉS</p><h2>Un catalogue bien entouré.</h2></div><Icon name="search" size={22} /></div>
            <div className="attention-count">—<span>produits sans fournisseur</span></div>
            <p className="text-sm leading-relaxed text-[#716347] mt-4">La couverture de votre catalogue apparaîtra après le chargement des données.</p>
          </section>
        </div>
      )}

      <section>
        <p className="eyebrow mb-2">PASSER À L&apos;ACTION</p><h2 className="text-xl font-medium text-gray-900 tracking-tight mb-5">À chaque besoin, le bon chemin.</h2>
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
