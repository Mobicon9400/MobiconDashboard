import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const CARDS = [
  {
    href: "/rufnummern",
    title: "Rufnummern",
    description: "Namen, BAN und erwarteten Betrag pro Rufnummer verwalten.",
  },
  {
    href: "/rechnungen",
    title: "Rechnungen",
    description: "PDF-Rechnungen von A1, Magenta und Drei hochladen.",
  },
  {
    href: "/berichte",
    title: "Berichte",
    description: "Monatliche Kostenaufstellung als PDF und Excel herunterladen.",
  },
  {
    href: "/warnliste",
    title: "Warnliste",
    description: "Rufnummern mit Abweichung vom erwarteten Betrag (> 30 €).",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Übersicht</h1>
      <p className="mt-1 text-zinc-600">
        Verrechnungsübersicht für A1, Magenta und Drei.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-mobicon-green"
          >
            <h2 className="font-semibold text-mobicon-dark">{card.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
