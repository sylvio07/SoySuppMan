'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
          {children}
        </main>
      </div>
    </>
  );
}
