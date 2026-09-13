import { AppShell } from "@/components/AppShell";

export default function RechnungenPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Rechnungen</h1>
      <p className="mt-1 text-zinc-600">
        Hier werden PDF-Rechnungen von A1, Magenta und Drei hochgeladen und
        automatisch ausgewertet.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
        Der PDF-Import folgt im nächsten Ausbauschritt.
      </div>
    </AppShell>
  );
}
