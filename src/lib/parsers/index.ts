import "server-only";
import { extractPdfLines, pagesToLineStrings } from "@/lib/pdf/extractLines";
import { parseA1 } from "./a1";
import { parseMagenta } from "./magenta";
import { parseDrei } from "./drei";
import type { ParsedInvoice } from "./types";

export type Anbieter = "A1" | "Magenta" | "Drei";

// PDF-Extraktion liefert je nach Erzeuger unterschiedliche Bindestrich-Glyphen
// (non-breaking hyphen, En-/Em-Dash) statt eines normalen "-"; ohne
// Normalisierung reißt das feste Muster "T-Mobile" sonst grundlos.
function normalisiere(text: string): string {
  return text.replace(/[‐-―−]/g, "-");
}

export function detectAnbieter(allLines: string[]): Anbieter | null {
  const text = normalisiere(allLines.join(" "));
  if (/A1 Telekom Austria/i.test(text) || /Ihre A1 Rechnung/i.test(text)) return "A1";
  // "T-Mobile Austria GmbH" ist die alte Rechtsform vor dem Rebranding zu
  // Magenta (2018); echte Kundenrechnungen zeigen oft nur noch die Marke
  // "Magenta Telekom" im extrahierten Text, ohne die alte GmbH-Zeile.
  if (
    /T-Mobile Austria/i.test(text) ||
    /Ihre Magenta Rechnung/i.test(text) ||
    /Magenta Telekom/i.test(text)
  ) {
    return "Magenta";
  }
  // Drei hieß rechtsförmlich vor der Fusion mit Orange (~2013) "Hutchison
  // 3G Austria GmbH"; ältere Rechnungen tragen noch diesen Namen.
  if (/Hutchison (Drei|3G) Austria/i.test(text)) return "Drei";
  return null;
}

export async function parseRechnungPdf(buffer: ArrayBuffer): Promise<ParsedInvoice> {
  const pages = await extractPdfLines(buffer);
  const lines = pagesToLineStrings(pages);
  const anbieter = detectAnbieter(lines);

  if (anbieter === "A1") return parseA1(pages);
  if (anbieter === "Magenta") return parseMagenta(pages);
  if (anbieter === "Drei") return parseDrei(pages);

  // Ohne die Originaldatei (die wir nach einem Fehlschlag bisher gelöscht
  // haben) lässt sich ein falsch erkannter Anbieter nicht diagnostizieren.
  // Die ersten Zeilen der Rechnung landen deshalb direkt in der
  // Fehlermeldung, die im Upload-Status angezeigt wird.
  const kopf = lines.slice(0, 12).join(" | ").slice(0, 400);
  throw new Error(
    `Anbieter konnte nicht erkannt werden. Unterstützt werden A1, Magenta und Drei. ` +
      `Rechnungskopf: "${kopf}"`,
  );
}

export * from "./types";
