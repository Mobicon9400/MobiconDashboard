import { AppShell } from "@/components/AppShell";

export default function BerichtePage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Berichte</h1>
      <p className="mt-1 text-zinc-600">
        Monatliche Kostenaufstellung als PDF (Querformat) und Excel zum
        Herunterladen — laufender Monat sowie alle abgeschlossenen Monate.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
        Die Berichtserstellung folgt, sobald der PDF-Import steht.
      </div>
    </AppShell>
  );
}
