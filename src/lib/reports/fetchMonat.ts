import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MonatsRow } from "./types";

export async function fetchMonatsdaten(monat: string): Promise<MonatsRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_monatsuebersicht")
    .select("*")
    .eq("monat", monat);

  if (error) {
    throw new Error(`Monatsdaten konnten nicht geladen werden: ${error.message}`);
  }

  return (data ?? []) as MonatsRow[];
}
