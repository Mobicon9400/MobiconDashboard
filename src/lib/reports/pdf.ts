import PDFDocument from "pdfkit";
import { REPORT_SPALTEN, type ReportRow } from "./types";

function euro(value: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const SPALTENBREITEN = [80, 55, 65, 50, 50, 50, 50, 50, 40, 50, 65, 65, 50, 70];
const ZELLEN_PADDING = 4;
const HEADER_FONT_SIZE = 7.5;
const ZEILEN_FONT_SIZE = 7;

function zeilenWerte(row: ReportRow): string[] {
  return [
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
    row.rechnungsnummer,
    row.netzbetreiber,
    row.bemerkungen,
  ];
}

/**
 * Zeichnet Tabellenzeilen zell- statt seitenweise, mit vorab per
 * heightOfString gemessener Zeilenhöhe. pdfkits eigenes doc.table() bricht
 * Zeilen sonst intern und ohne Rücksprache um, sodass einzelne Zeilen
 * unangekündigt auf eine neue (dann fast leere) Seite rutschen.
 */
export async function buildPdfBericht(monat: string, rows: ReportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 24 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = doc.page.margins.left;
    const tabellenBreite = SPALTENBREITEN.reduce((a, b) => a + b, 0);
    const spaltenX: number[] = [];
    {
      let x = margin;
      for (const breite of SPALTENBREITEN) {
        spaltenX.push(x);
        x += breite;
      }
    }
    const seitenUnterkante = () => doc.page.height - doc.page.margins.bottom;

    function zellenHoehe(werte: string[], fontSize: number): number {
      doc.fontSize(fontSize);
      let max = 0;
      werte.forEach((text, i) => {
        const h = doc.heightOfString(text || " ", {
          width: SPALTENBREITEN[i] - ZELLEN_PADDING * 2,
        });
        if (h > max) max = h;
      });
      return max + ZELLEN_PADDING * 2;
    }

    function zeichneTitel() {
      doc
        .fontSize(16)
        .fillColor("#2d3e4f")
        .text(`Mobicon Verrechnung – ${monat}`, margin, margin, { width: tabellenBreite });
      doc.moveDown(0.6);
    }

    function zeichneHeader() {
      const werte = [...REPORT_SPALTEN];
      const hoehe = zellenHoehe(werte, HEADER_FONT_SIZE);
      const y = doc.y;
      doc.rect(margin, y, tabellenBreite, hoehe).fill("#2d3e4f");
      doc.fillColor("white").fontSize(HEADER_FONT_SIZE);
      werte.forEach((text, i) => {
        doc.text(text, spaltenX[i] + ZELLEN_PADDING, y + ZELLEN_PADDING, {
          width: SPALTENBREITEN[i] - ZELLEN_PADDING * 2,
        });
      });
      doc.y = y + hoehe;
      doc.fillColor("black");
    }

    function zeichneZeile(werte: string[], hintergrund?: string) {
      const hoehe = zellenHoehe(werte, ZEILEN_FONT_SIZE);
      const y = doc.y;
      if (hintergrund) {
        doc.rect(margin, y, tabellenBreite, hoehe).fill(hintergrund);
      }
      doc.fillColor("black").fontSize(ZEILEN_FONT_SIZE);
      werte.forEach((text, i) => {
        doc.text(text || "", spaltenX[i] + ZELLEN_PADDING, y + ZELLEN_PADDING, {
          width: SPALTENBREITEN[i] - ZELLEN_PADDING * 2,
        });
      });
      doc
        .moveTo(margin, y + hoehe)
        .lineTo(margin + tabellenBreite, y + hoehe)
        .lineWidth(0.5)
        .strokeColor("#d4d4d8")
        .stroke();
      doc.y = y + hoehe;
    }

    function neueSeite() {
      doc.addPage({ size: "A4", layout: "landscape", margin });
      zeichneTitel();
      zeichneHeader();
    }

    zeichneTitel();
    zeichneHeader();

    for (const row of rows) {
      const werte = zeilenWerte(row);
      const hoehe = zellenHoehe(werte, ZEILEN_FONT_SIZE);
      if (doc.y + hoehe > seitenUnterkante()) {
        neueSeite();
      }
      zeichneZeile(werte, row.istSummenzeile ? "#f0f4e8" : undefined);
    }

    doc.end();
  });
}
