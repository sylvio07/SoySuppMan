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
      <div className="min-h-screen overflow-x-hidden">
        <main className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 animate-fadeIn">
          {children}
        </main>
      </div>
    </>
  );
}
