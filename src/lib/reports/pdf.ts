import PDFDocument from "pdfkit";
import { REPORT_SPALTEN, type ReportRow } from "./types";

function euro(value: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const SPALTENBREITEN = [90, 60, 50, 55, 55, 55, 55, 55, 45, 55, 90, 128];
const ROWS_PRO_SEITE = 20;

function headerRow() {
  return REPORT_SPALTEN.map((label) => ({
    text: label,
    type: "TH" as const,
    backgroundColor: "#2d3e4f",
    textColor: "white",
    font: { size: 7.5 },
  }));
}

export async function buildPdfBericht(monat: string, rows: ReportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 24 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const seiten =
      rows.length === 0
        ? [[]]
        : Array.from({ length: Math.ceil(rows.length / ROWS_PRO_SEITE) }, (_, i) =>
            rows.slice(i * ROWS_PRO_SEITE, (i + 1) * ROWS_PRO_SEITE),
          );

    seiten.forEach((seite, index) => {
      if (index > 0) doc.addPage({ size: "A4", layout: "landscape", margin: 24 });

      doc
        .fontSize(16)
        .fillColor("#2d3e4f")
        .text(`Mobicon Verrechnung – ${monat}`, { align: "left" });
      doc.moveDown(0.6);
      doc.fontSize(7);

      const table = doc.table({
        columnStyles: SPALTENBREITEN,
        defaultStyle: {
          padding: 4,
          border: [0, 0, 0.5, 0.5],
          borderColor: "#d4d4d8",
        },
      });

      table.row(headerRow());

      for (const row of seite) {
        const werte = [
          row.name,
          row.rufnummer,
          row.ban,
          euro(row.verbindungsentgelte_20),
          euro(row.drittanbieter_20),
          euro(row.drittanbieter_0),
          euro(row.online_dienste_20),
          euro(row.online_dienste_0),
          euro(row.steuer),
          euro(row.gesamtsumme),
          row.abrechnungszeitraum,
          row.bemerkungen,
        ];

        table.row(
          werte.map((text) =>
            row.istSummenzeile ? { text, backgroundColor: "#f0f4e8" } : { text },
          ),
        );
      }

      table.end();
    });

    doc.end();
  });
}
