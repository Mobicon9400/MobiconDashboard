import "server-only";
import { extractPdfLines, pagesToLineStrings } from "@/lib/pdf/extractLines";
import { parseA1 } from "./a1";
import { parseMagenta } from "./magenta";
import { parseDrei } from "./drei";
import type { ParsedInvoice } from "./types";

export type Anbieter = "A1" | "Magenta" | "Drei";

export function detectAnbieter(allLines: string[]): Anbieter | null {
  const text = allLines.join(" ");
  if (/A1 Telekom Austria/.test(text) || /Ihre A1 Rechnung/.test(text)) return "A1";
  if (/T-Mobile Austria GmbH/.test(text) || /Ihre Magenta Rechnung/.test(text)) {
    return "Magenta";
  }
  // Drei hieß rechtsförmlich vor der Fusion mit Orange (~2013) "Hutchison
  // 3G Austria GmbH"; ältere Rechnungen tragen noch diesen Namen.
  if (/Hutchison (Drei|3G) Austria/.test(text)) return "Drei";
  return null;
}

export async function parseRechnungPdf(buffer: ArrayBuffer): Promise<ParsedInvoice> {
  const pages = await extractPdfLines(buffer);
  const lines = pagesToLineStrings(pages);
  const anbieter = detectAnbieter(lines);

  if (anbieter === "A1") return parseA1(pages);
  if (anbieter === "Magenta") return parseMagenta(pages);
  if (anbieter === "Drei") return parseDrei(pages);

  throw new Error(
    "Anbieter konnte nicht erkannt werden. Unterstützt werden A1, Magenta und Drei.",
  );
}

export * from "./types";
