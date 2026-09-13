import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ANBIETER_NACH_SHEET,
  istPlausibleRufnummer,
  normalisiereRufnummer,
} from "@/lib/rufnummern";

function zelleAlsText(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function findeHeaderZeile(sheet: ExcelJS.Worksheet) {
  for (let rowNumber = 1; rowNumber <= Math.min(10, sheet.rowCount); rowNumber++) {
    const row = sheet.getRow(rowNumber);
    let rufCol: number | null = null;
    let nameCol: number | null = null;
    let banCol: number | null = null;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = zelleAlsText(cell.value)?.toLowerCase();
      if (!text) return;
      if (text === "rufnummer") rufCol = colNumber;
      if (text === "name") nameCol = colNumber;
      if (/kdnr|ban\b|kundennummer/.test(text)) banCol = colNumber;
    });

    if (rufCol) {
      // Manche Tabellenblätter (z.B. H3G) beschriften die Namensspalte gar
      // nicht - dort steht der Name einfach direkt neben Rufnummer/KDNr.
      if (!nameCol) nameCol = banCol ? banCol + 1 : rufCol + 1;
      return { headerRow: rowNumber, rufCol, nameCol, banCol };
    }
  }
  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("datei");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  type Eintrag = {
    rufnummer_normalisiert: string;
    rufnummer_anzeige: string;
    name: string;
    anbieter: "A1" | "Drei" | "Magenta";
    ban: string | null;
  };

  const eintraege = new Map<string, Eintrag>();
  const verarbeiteteSheets: string[] = [];

  for (const [sheetName, anbieter] of Object.entries(ANBIETER_NACH_SHEET)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) continue;

    const header = findeHeaderZeile(sheet);
    if (!header) continue;

    verarbeiteteSheets.push(sheetName);
    const { headerRow, rufCol, nameCol, banCol } = header;
    const banFallbackCol = banCol ?? rufCol + 1;

    for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (row.hidden) continue;

      const rufnummerRoh = zelleAlsText(row.getCell(rufCol).value);
      if (!rufnummerRoh) continue;

      const normalisiert = normalisiereRufnummer(rufnummerRoh);
      if (!istPlausibleRufnummer(normalisiert)) continue;

      const name = nameCol ? zelleAlsText(row.getCell(nameCol).value) : null;
      if (!name) continue;

      const banRoh = zelleAlsText(row.getCell(banFallbackCol).value);
      const ban = banRoh && /^\d+$/.test(banRoh) ? banRoh : banCol ? banRoh : null;

      eintraege.set(normalisiert, {
        rufnummer_normalisiert: normalisiert,
        rufnummer_anzeige: rufnummerRoh,
        name,
        anbieter,
        ban,
      });
    }
  }

  if (eintraege.size === 0) {
    return NextResponse.json(
      {
        error:
          "Keine verwertbaren Zeilen gefunden. Erwartet werden die Tabellenblätter 'Bus und Comp', 'H3G' und 'Magenta' mit Spalten 'Rufnummer' und 'Name'.",
        verarbeiteteSheets,
      },
      { status: 422 },
    );
  }

  const supabase = createAdminClient();
  const rows = Array.from(eintraege.values());

  const { error } = await supabase
    .from("rufnummern")
    .upsert(rows, { onConflict: "rufnummer_normalisiert" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Die Namensliste ist die Quelle der Wahrheit: schon hochgeladene
  // Rechnungen tragen ihren Namen sonst dauerhaft mit dem Stand von vor
  // diesem Import fest.
  await supabase.rpc("sync_rechnungspositionen_namen", {
    eintraege: rows.map((r) => ({
      rufnummer_normalisiert: r.rufnummer_normalisiert,
      name: r.name,
    })),
  });

  return NextResponse.json({ importiert: rows.length, verarbeiteteSheets });
}
