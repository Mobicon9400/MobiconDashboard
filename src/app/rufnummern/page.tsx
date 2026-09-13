import { AppShell } from "@/components/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { RufnummernTable } from "./RufnummernTable";

export const dynamic = "force-dynamic";

export default async function RufnummernPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rufnummern")
    .select("*")
    .order("name", { ascending: true });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-mobicon-dark">Rufnummern</h1>
      <p className="mt-1 text-zinc-600">
        Namens- und BAN-Zuordnung pro Rufnummer sowie erwarteter Betrag für die
        Warnliste. Über den Excel-Import werden bestehende Einträge anhand der
        Rufnummer aktualisiert, ohne den erwarteten Betrag zu überschreiben.
      </p>
      {error && (
        <p className="mt-4 text-sm text-red-600">
          Fehler beim Laden: {error.message}
        </p>
      )}
      <RufnummernTable initialRows={data ?? []} />
    </AppShell>
  );
}
