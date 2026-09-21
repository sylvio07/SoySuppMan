'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon from './Icon';

const navLinks = [
  { href: '/', label: 'Vue d’ensemble', icon: 'grid' },
  { href: '/suppliers', label: 'Fournisseurs', icon: 'users' },
  { href: '/products', label: 'Produits', icon: 'leaf' },
  { href: '/categories', label: 'Catégories', icon: 'layers' },
  { href: '/import', label: 'Importer', icon: 'upload' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(false);
  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  async function handleSignOut() {
    setSigningOut(true);
    setError(false);
    try {
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
      router.push('/login');
      router.refresh();
    } catch { setError(true); }
    finally { setSigningOut(false); }
  }

  const links = navLinks.map(({ href, label, icon }) => (
    <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setMobileOpen(false)} className={`nav-link ${isActive(href) ? 'is-active' : ''}`}>
      <Icon name={icon} size={16} />{label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-gray-200">
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[80px] gap-4">
        <Link href="/" aria-label="SOYCAIN — Accueil" className="flex items-center gap-3 shrink-0">
          <span className="brand-mark"><Icon name="leaf" size={25} /></span>
          <span><span className="block text-[19px] font-bold text-green-800 tracking-[.16em]">SOYCAIN</span><span className="block text-[9px] font-medium text-gray-500 tracking-[.12em] uppercase mt-0.5">L’intelligence des filières</span></span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1">{links}</nav>
        <button onClick={handleSignOut} disabled={signingOut} className="hidden lg:inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-green-800 p-3 rounded-lg disabled:opacity-50"><Icon name="logout" size={16} />{signingOut ? 'Déconnexion…' : 'Déconnexion'}</button>
        <button type="button" className="lg:hidden p-3 rounded-lg text-green-800 hover:bg-green-50" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen} aria-controls="mobile-nav" onClick={() => setMobileOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'Escape') setMobileOpen(false); }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={mobileOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
        </button>
      </div>
      {mobileOpen && <nav id="mobile-nav" aria-label="Navigation mobile" className="lg:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1" onKeyDown={(event) => { if (event.key === 'Escape') setMobileOpen(false); }}>{links}<button onClick={handleSignOut} disabled={signingOut} className="nav-link w-full"><Icon name="logout" size={16} />{signingOut ? 'Déconnexion…' : 'Déconnexion'}</button></nav>}
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 px-6 py-2">Déconnexion impossible. Veuillez réessayer.</p>}
    </header>
  );
}
