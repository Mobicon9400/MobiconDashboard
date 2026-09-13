import { AppShell } from "@/components/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default async function WarnlistePage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_warnliste")
    .select("*")
    .order("monat", { ascending: false });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Warnliste</h1>
      <p className="mt-1 text-zinc-600">
        Rufnummern, deren monatlicher Gesamtbetrag um mehr als 30 € vom
        hinterlegten erwarteten Betrag abweicht.
      </p>
      {error && (
        <p className="mt-4 text-sm text-red-600">Fehler beim Laden: {error.message}</p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Monat</th>
              <th className="px-3 py-2">Rufnummer</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 text-right">Erwartet</th>
              <th className="px-3 py-2 text-right">Ist</th>
              <th className="px-3 py-2 text-right">Abweichung</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr
                key={`${row.monat}-${row.rufnummer_normalisiert}`}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="px-3 py-2">{row.monat}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.rufnummer_anzeige}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 text-right">{formatEuro(row.erwarteter_betrag)}</td>
                <td className="px-3 py-2 text-right">{formatEuro(row.ist_betrag)}</td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    row.abweichung > 0 ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {row.abweichung > 0 ? "+" : ""}
                  {formatEuro(row.abweichung)}
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-400">
                  Keine Auffälligkeiten.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
