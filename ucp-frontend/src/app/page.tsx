import Link from "next/link";
import TopHeader from "@/app/components/TopHeader";

export default function HomePage() {
  return (
    <div className="app-shell">
      <TopHeader />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-grid" aria-hidden="true" />
          <div className="home-hero-shape home-hero-shape-green" aria-hidden="true" />
          <div className="home-hero-shape home-hero-shape-gray" aria-hidden="true" />

          <div className="home-hero-content">
            <p className="home-kicker">Plateforme UCP</p>
            <h1 className="home-title">Gestion moderne des marches publics</h1>
            <p className="home-subtitle">
              Une interface unifiee pour l&apos;accueil, la connexion, le dashboard et le formulaire de passation.
            </p>

            <div className="home-actions">
              <Link href="/login" className="home-btn home-btn-primary">
                Se connecter
              </Link>
              <Link href="/formulaire" className="home-btn home-btn-secondary">
                Ouvrir le formulaire
              </Link>
              <Link href="/dashboard" className="home-btn home-btn-secondary">
                Voir le dashboard final
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
