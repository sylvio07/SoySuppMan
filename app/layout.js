import localFont from "next/font/local";
import NavBar from "@/app/components/NavBar";
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

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased text-gray-900`}>
        <NavBar />
        <div className="min-h-screen bg-gray-50">
          <main className="max-w-7xl mx-auto px-6 py-8 animate-fadeIn">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
