import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMonatsdaten } from "@/lib/reports/fetchMonat";
import { buildReportRows } from "@/lib/reports/buildRows";
import { buildExcelBericht } from "@/lib/reports/excel";
import { buildPdfBericht } from "@/lib/reports/pdf";

const MONAT_REGEX = /^\d{4}-\d{2}$/;

// Große Monate (viele Rufnummern) + PDF/Excel-Erzeugung + zwei Storage-Uploads
// können das Standardlimit (10s) überschreiten.
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const monat = body?.monat;

  if (typeof monat !== "string" || !MONAT_REGEX.test(monat)) {
    return NextResponse.json(
      { error: "Ungültiger Monat. Erwartet wird das Format YYYY-MM." },
      { status: 400 },
    );
  }

  const monatsdaten = await fetchMonatsdaten(monat);
  const rows = buildReportRows(monatsdaten);

  const [excelBuffer, pdfBuffer] = await Promise.all([
    buildExcelBericht(monat, rows),
    buildPdfBericht(monat, rows),
  ]);

  const supabase = createAdminClient();
  const bucket = supabase.storage.from("reports");

  const [excelUpload, pdfUpload] = await Promise.all([
    bucket.upload(`${monat}/bericht.xlsx`, excelBuffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    }),
    bucket.upload(`${monat}/bericht.pdf`, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    }),
  ]);

  if (excelUpload.error || pdfUpload.error) {
    return NextResponse.json(
      {
        error:
          excelUpload.error?.message ??
          pdfUpload.error?.message ??
          "Bericht konnte nicht gespeichert werden.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    monat,
    anzahlZeilen: rows.length,
    anzahlRufnummern: monatsdaten.length,
  });
}
