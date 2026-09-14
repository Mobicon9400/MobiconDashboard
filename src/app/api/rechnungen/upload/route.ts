import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRechnungPdf } from "@/lib/parsers";
import { round2 } from "@/lib/parsers/types";

// PDF-Parsing + Storage-Upload einer großen Rechnung, kombiniert mit einer
// langsameren Kundenverbindung beim eigentlichen Datei-Upload, lag bei
// echten Uploads konstant bei 48-57s - zu nah an einem 60s-Limit. Auf das
// Maximum angehoben, damit auch größere Rechnungen/langsamere Leitungen
// nicht knapp über die Kante fallen.
export const maxDuration = 300;

function berechneMonat(rechnungsdatum: string | null): string {
  if (rechnungsdatum) return rechnungsdatum.slice(0, 7);
  return new Date().toISOString().slice(0, 7);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("datei");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  let invoice;
  try {
    invoice = await parseRechnungPdf(await file.arrayBuffer());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF konnte nicht gelesen werden." },
      { status: 422 },
    );
  }

  const supabase = createAdminClient();
  const monat = berechneMonat(invoice.rechnungsdatum);

  const { data: rufnummernMappings } = await supabase
    .from("rufnummern")
    .select("rufnummer_normalisiert, name, ban")
    .in(
      "rufnummer_normalisiert",
      invoice.positionen.map((p) => p.rufnummer_normalisiert),
    );

  const mappingByRufnummer = new Map(
    (rufnummernMappings ?? []).map((r) => [r.rufnummer_normalisiert, r]),
  );

  let rechnungId: string;

  if (invoice.rechnungsnummer) {
    const { data: existing } = await supabase
      .from("rechnungen")
      .select("id")
      .eq("anbieter", invoice.anbieter)
      .eq("rechnungsnummer", invoice.rechnungsnummer)
      .maybeSingle();

    if (existing) {
      rechnungId = existing.id;
      await supabase.from("rechnungspositionen").delete().eq("rechnung_id", rechnungId);
      await supabase
        .from("rechnungen")
        .update({
          monat,
          rechnungsdatum: invoice.rechnungsdatum,
          dateiname: file.name,
          status: "hochgeladen",
          fehlermeldung: null,
        })
        .eq("id", rechnungId);
    } else {
      const { data: inserted, error } = await supabase
        .from("rechnungen")
        .insert({
          anbieter: invoice.anbieter,
          rechnungsnummer: invoice.rechnungsnummer,
          rechnungsdatum: invoice.rechnungsdatum,
          monat,
          dateiname: file.name,
        })
        .select("id")
        .single();
      if (error || !inserted) {
        return NextResponse.json(
          { error: error?.message ?? "Rechnung konnte nicht gespeichert werden." },
          { status: 500 },
        );
      }
      rechnungId = inserted.id;
    }
  } else {
    const { data: inserted, error } = await supabase
      .from("rechnungen")
      .insert({
        anbieter: invoice.anbieter,
        rechnungsnummer: null,
        rechnungsdatum: invoice.rechnungsdatum,
        monat,
        dateiname: file.name,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message ?? "Rechnung konnte nicht gespeichert werden." },
        { status: 500 },
      );
    }
    rechnungId = inserted.id;
  }

  const storagePfad = `${invoice.anbieter}/${monat}/${rechnungId}.pdf`;
  await supabase.storage
    .from("rechnungen")
    .upload(storagePfad, await file.arrayBuffer(), {
      contentType: "application/pdf",
      upsert: true,
    });
  await supabase.from("rechnungen").update({ storage_pfad: storagePfad }).eq("id", rechnungId);

  const positionsRows = invoice.positionen.map((pos) => {
    const mapping = mappingByRufnummer.get(pos.rufnummer_normalisiert);
    const steuer = round2(
      0.2 * (pos.verbindungsentgelte_20 + pos.drittanbieter_20 + pos.online_dienste_20),
    );
    const gesamtsumme = round2(
      pos.verbindungsentgelte_20 +
        pos.drittanbieter_20 +
        pos.drittanbieter_0 +
        pos.online_dienste_20 +
        pos.online_dienste_0 +
        steuer,
    );

    return {
      rechnung_id: rechnungId,
      monat,
      rufnummer_normalisiert: pos.rufnummer_normalisiert,
      rufnummer_anzeige: pos.rufnummer_anzeige,
      name: mapping?.name ?? pos.nameAusRechnung ?? null,
      ban: mapping?.ban ?? invoice.ban ?? null,
      verbindungsentgelte_20: round2(pos.verbindungsentgelte_20),
      drittanbieter_20: round2(pos.drittanbieter_20),
      drittanbieter_0: round2(pos.drittanbieter_0),
      online_dienste_20: round2(pos.online_dienste_20),
      online_dienste_0: round2(pos.online_dienste_0),
      steuer,
      gesamtsumme,
      abrechnungszeitraum: pos.abrechnungszeitraum || null,
      bemerkungen: pos.bemerkungen || null,
    };
  });

  const { error: insertError } = await supabase
    .from("rechnungspositionen")
    .insert(positionsRows);

  if (insertError) {
    await supabase
      .from("rechnungen")
      .update({ status: "fehler", fehlermeldung: insertError.message })
      .eq("id", rechnungId);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("rechnungen").update({ status: "verarbeitet" }).eq("id", rechnungId);

  return NextResponse.json({
    rechnungId,
    anbieter: invoice.anbieter,
    rechnungsnummer: invoice.rechnungsnummer,
    monat,
    anzahlPositionen: positionsRows.length,
  });
}
