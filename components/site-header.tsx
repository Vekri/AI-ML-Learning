import Link from "next/link";
import { rounds } from "@/lib/rounds";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="font-serif text-xl tracking-tight">
          AI/ML Interview Lab
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {rounds.map((round) => (
            <Link key={round.slug} href={`/rounds/${round.slug}`} className="text-muted hover:text-ink">
              {round.number}. {round.short}
            </Link>
          ))}
          <Link href="/lab" className="text-muted hover:text-ink">
            Run code
          </Link>
          <Link href="/stack" className="text-muted hover:text-ink">
            Technologies
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-6 text-sm text-muted">
        <p>Study material for a senior AI/ML interview. Adapt every project story to work you did.</p>
        <a href="https://github.com/Vekri/AI-ML-Learning" className="hover:text-ink">
          Vekri/AI-ML-Learning
        </a>
      </div>
    </footer>
  );
}
