import { AppShell } from "@/components/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { RechnungenUpload, ANBIETER_FARBEN } from "./RechnungenUpload";

export const dynamic = "force-dynamic";

export default async function RechnungenPage() {
  const supabase = createAdminClient();
  const { data: rechnungen, error } = await supabase
    .from("rechnungen")
    .select("id, anbieter, rechnungsnummer, rechnungsdatum, monat, dateiname, status, hochgeladen_am")
    .order("hochgeladen_am", { ascending: false })
    .limit(50);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Rechnungen</h1>
      <p className="mt-1 text-zinc-600">
        PDF-Rechnungen von A1, Magenta und Drei hochladen. Anbieter, Monat und
        Rufnummern werden automatisch erkannt; die Daten fließen in die
        Monatsübersicht und die Warnliste ein.
      </p>

      <RechnungenUpload />

      {error && (
        <p className="mt-4 text-sm text-red-600">Fehler beim Laden: {error.message}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Hochgeladen</th>
              <th className="px-3 py-2">Anbieter</th>
              <th className="px-3 py-2">Rechnungsnummer</th>
              <th className="px-3 py-2">Rechnungsdatum</th>
              <th className="px-3 py-2">Monat</th>
              <th className="px-3 py-2">Datei</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(rechnungen ?? []).map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {new Date(r.hochgeladen_am).toLocaleString("de-AT")}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${ANBIETER_FARBEN[r.anbieter]}`}
                  >
                    {r.anbieter}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-700">
                  {r.rechnungsnummer ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {r.rechnungsdatum ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-600">{r.monat}</td>
                <td className="px-3 py-2 text-zinc-600">{r.dateiname}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      r.status === "verarbeitet"
                        ? "text-mobicon-green-dark"
                        : r.status === "fehler"
                          ? "text-red-600"
                          : "text-zinc-500"
                    }
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {(rechnungen ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-400">
                  Noch keine Rechnungen hochgeladen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
