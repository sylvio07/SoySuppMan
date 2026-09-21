'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon from './Icon';

const navLinks = [
  { href: '/', label: 'Vue d’ensemble', icon: 'grid' },
  { href: '/import', label: 'Importer', icon: 'upload' },
  { href: '/suppliers', label: 'Fournisseurs', icon: 'users' },
  { href: '/categories', label: 'Catégories', icon: 'layers' },
  { href: '/products', label: 'Produits', icon: 'box' },
];

export default function NavBar() {
  const pathname = usePathname(); const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false); const [signingOut, setSigningOut] = useState(false);
  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const handleSignOut = async () => { setSigningOut(true); await supabase.auth.signOut(); router.push('/login'); router.refresh(); };
  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-[#dce7da]">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-[72px]">
        <Link href="/" className="flex items-center gap-3 group"><span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#123d2d] text-[#f4ca80] shadow-sm group-hover:rotate-3 transition-transform"><Icon name="spark" size={19} /></span><span><span className="block text-[17px] font-black text-[#123d2d] tracking-[.18em]">SOYCAIN</span><span className="block text-[9px] font-semibold text-[#79917f] tracking-[.16em] uppercase">Sourcing intelligence</span></span></Link>
        <nav className="hidden md:flex items-center gap-1">{navLinks.map(({ href, label, icon }) => <Link key={href} href={href} className={`flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg transition-colors ${isActive(href) ? 'text-[#1d5a40] font-semibold bg-[#edf4e9]' : 'text-[#6d8176] hover:text-[#18352b] hover:bg-[#f3f7f0]'}`}><Icon name={icon} size={15} />{label}</Link>)}</nav>
        <div className="flex items-center gap-2"><button onClick={handleSignOut} disabled={signingOut} className="hidden md:inline-flex items-center gap-2 text-xs font-medium text-[#6d8176] hover:text-[#b34c37] hover:bg-[#fff2ee] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"><Icon name="logout" size={15} />{signingOut ? '…' : 'Déconnexion'}</button><button type="button" className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-[#6d8176] hover:bg-[#edf4e9]" aria-label="Ouvrir le menu" onClick={() => setMobileOpen((prev) => !prev)}><span className="text-xl leading-none">{mobileOpen ? '×' : '☰'}</span></button></div>
      </div></div>
      {mobileOpen && <nav className="md:hidden border-t border-[#dce7da] bg-white/95 px-4 py-3 space-y-1">{navLinks.map(({ href, label, icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive(href) ? 'text-[#1d5a40] font-semibold bg-[#edf4e9]' : 'text-[#6d8176]'}`}><Icon name={icon} size={16} />{label}</Link>)}<button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#b34c37]"><Icon name="logout" size={16} />Déconnexion</button></nav>}
    </header>
  );
}
