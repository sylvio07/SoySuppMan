import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata = {
  title: "Soycain — Gestion Fournisseurs",
  description: "Application de gestion et qualification de fournisseurs Soycain",
};

const navLinks = [
  { href: "/", label: "Tableau de bord" },
  { href: "/import", label: "Importer" },
  { href: "/suppliers", label: "Fournisseurs" },
  { href: "/categories", label: "Catégories" },
  { href: "/products", label: "Produits" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
          <span className="font-bold text-lg text-green-700">Soycain</span>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-green-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
