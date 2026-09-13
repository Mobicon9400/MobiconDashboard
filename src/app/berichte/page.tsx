import { AppShell } from "@/components/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { BerichteTable } from "./BerichteTable";

export const dynamic = "force-dynamic";

export default async function BerichtePage() {
  const supabase = createAdminClient();

  const { data: rechnungen } = await supabase
    .from("rechnungen")
    .select("monat")
    .order("monat", { ascending: false });

  const monate = Array.from(new Set((rechnungen ?? []).map((r) => r.monat)));

  const { data: reportOrdner } = await supabase.storage.from("reports").list();
  const vorhandeneMonate = new Set((reportOrdner ?? []).map((entry) => entry.name));

  const aktuellerMonat = new Date().toISOString().slice(0, 7);

  const eintraege = monate.map((monat) => ({
    monat,
    aktuellerMonat: monat === aktuellerMonat,
    berichtVorhanden: vorhandeneMonate.has(monat),
  }));

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Berichte</h1>
      <p className="mt-1 text-zinc-600">
        Monatliche Kostenaufstellung als PDF (Querformat) und Excel zum
        Herunterladen — laufender Monat sowie alle abgeschlossenen Monate.
      </p>
      <BerichteTable monate={eintraege} />
    </AppShell>
  );
}
