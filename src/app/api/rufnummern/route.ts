import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { istPlausibleRufnummer, normalisiereRufnummer } from "@/lib/rufnummern";

export async function POST(request: Request) {
  const body = await request.json();
  const rufnummerAnzeige = String(body.rufnummer_anzeige ?? "").trim();
  const name = String(body.name ?? "").trim();
  const anbieter = body.anbieter;

  const normalisiert = normalisiereRufnummer(rufnummerAnzeige);
  if (!istPlausibleRufnummer(normalisiert) || !name) {
    return NextResponse.json(
      { error: "Bitte gültige Rufnummer und Namen angeben." },
      { status: 400 },
    );
  }
  if (!["A1", "Magenta", "Drei"].includes(anbieter)) {
    return NextResponse.json({ error: "Ungültiger Anbieter." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("rufnummern").insert({
    rufnummer_normalisiert: normalisiert,
    rufnummer_anzeige: rufnummerAnzeige,
    name,
    anbieter,
    ban: body.ban ? String(body.ban).trim() : null,
    erwarteter_betrag:
      body.erwarteter_betrag === "" || body.erwarteter_betrag == null
        ? null
        : Number(body.erwarteter_betrag),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
