'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export default function ScrollProgress() {
  const bar = useRef(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      setShowTop(window.scrollY > 500);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    update();
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); resize.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <>
    <div ref={bar} className="scroll-progress" aria-hidden="true" />
    {showTop && <button className="back-to-top" aria-label="Revenir en haut de la page" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><Icon name="arrow" className="-rotate-90" /></button>}
  </>;
}
