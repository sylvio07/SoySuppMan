'use client';

import { useEffect, useRef } from 'react';

export default function PageMotion({ children }) {
  const root = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer;
    let mutations;
    function configure() {
      observer?.disconnect();
      mutations?.disconnect();
      if (media.matches || !('IntersectionObserver' in window)) return;
      const seen = new WeakSet();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.animate([
            { opacity: 0.5, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ], { duration: 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      const observe = () => root.current?.querySelectorAll('section, .soft-card, .catalog-card').forEach((element) => {
        if (!seen.has(element)) { seen.add(element); observer.observe(element); }
      });
      observe();
      mutations = new MutationObserver(observe);
      mutations.observe(root.current, { childList: true, subtree: true });
    }
    configure();
    media.addEventListener('change', configure);
    return () => { observer?.disconnect(); mutations?.disconnect(); media.removeEventListener('change', configure); };
  }, []);
  return <div ref={root}>{children}</div>;
}
