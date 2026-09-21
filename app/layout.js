import localFont from 'next/font/local';
import AppShell from '@/app/components/AppShell';
import './globals.css';

const geistSans = localFont({ src: './fonts/GeistVF.woff', variable: '--font-geist-sans', weight: '100 900' });

export const metadata = {
  title: 'SOYCAIN — Gestion fournisseurs',
  description: 'Pilotage du sourcing agroalimentaire et qualification des fournisseurs SOYCAIN',
};

export default function RootLayout({ children }) {
  return <html lang="fr"><body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased text-gray-900`}><AppShell>{children}</AppShell></body></html>;
}
