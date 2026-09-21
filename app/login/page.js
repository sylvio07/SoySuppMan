'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Icon from '@/app/components/Icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <main className="login-layout">
      <section className="login-story">
        <Image src="/soycain-agro-hero.png" alt="Récolte de soja et de sésame dans un paysage agricole" fill priority sizes="(max-width: 767px) 100vw, 54vw" />
        <div className="login-story-copy">
          <span className="text-xs tracking-[.2em] uppercase text-[#ead1a0]">De la terre aux opportunités</span>
          <h2>Des origines riches.<br />Des liens durables.</h2>
          <p>L’espace SOYCAIN pour connecter vos matières premières, vos partenaires et vos ambitions.</p>
        </div>
      </section>
      <div className="login-form-side">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="login-wordmark"><Icon name="leaf" /> SOYCAIN</div>

        {/* Card */}
        <div>
          <p className="eyebrow mb-3">VOTRE ESPACE DE TRAVAIL</p>
          <h1 className="text-3xl font-medium tracking-tight text-gray-900 mb-3">Heureux de vous retrouver.</h1>
          <p className="text-sm text-gray-500 mb-8">Connectez-vous pour retrouver votre réseau de fournisseurs.</p>

          {error && (
            <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="vous@soycain.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Connexion…
                </span>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Besoin d’un accès ? Contactez votre administrateur SOYCAIN.
        </p>
      </div>
      </div>
    </main>
  );
}
