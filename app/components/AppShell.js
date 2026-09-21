'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import PageMotion from './PageMotion';
import ScrollProgress from './ScrollProgress';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <ScrollProgress key={pathname} />
      <div className="min-h-screen overflow-x-hidden">
        <main id="main-content" className="workspace max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
          <PageMotion key={pathname}>{children}</PageMotion>
        </main>
        <footer className="workspace-footer"><span>SOYCAIN <span className="footer-dot">·</span> Cultiver les connexions.</span><span>Votre espace de sourcing agroalimentaire</span></footer>
      </div>
    </>
  );
}
