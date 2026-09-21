'use client';

import { useRef } from 'react';

// A small CSS sculpture: no canvas, animation library or rendering loop.
export default function BrandScene() {
  const scene = useRef(null);
  function tilt(event) {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current.style.setProperty('--tilt-x', `${(event.clientY - bounds.top - bounds.height / 2) / 30}deg`);
    scene.current.style.setProperty('--tilt-y', `${(event.clientX - bounds.left - bounds.width / 2) / 30}deg`);
  }
  function reset() {
    scene.current.style.setProperty('--tilt-x', '0deg');
    scene.current.style.setProperty('--tilt-y', '0deg');
  }
  return (
    <div className="brand-scene" aria-hidden="true" onPointerMove={tilt} onPointerLeave={reset} ref={scene}>
      <div className="seed-sculpture">
        <div className="seed-orbit" />
        <div className="seed seed-one" /><div className="seed seed-two" /><div className="seed seed-three" />
        <div className="sculpture-leaf leaf-one" /><div className="sculpture-leaf leaf-two" />
        <div className="seed-plinth" />
      </div>
    </div>
  );
}
