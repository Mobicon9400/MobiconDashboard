import { normalisiereRufnummer, istPlausibleRufnummer } from "@/lib/rufnummern";
import type { PdfLine } from "@/lib/pdf/extractLines";
import { pagesToLineStrings } from "@/lib/pdf/extractLines";
import {
  addBemerkung,
  makePosition,
  parseAmount,
  type ParsedInvoice,
  type ParsedPosition,
} from "./types";
import { parseGermanShortDate } from "./dateUtils";

const UEBERSICHT_HEADER = /^(Ü|U)bersicht f(ü|u)r\s+(\d{6,13})\b/;
const DETAILUEBERSICHT_HEADER = /^Detail(ü|u)bersicht Nutzungsentgelte f(ü|u)r\s+(\d{6,13})/;
const TRAILING_NETTO_TAX_BRUTTO =
  /(-?\d[\d.]*,\d{2})\s*(?:(\d{1,2})\s?%\s*)?(-?\d[\d.]*,\d{2})\s*$/;
const RECHNUNG_HEADER_VALUES =
  /^(\d{7,12})\s+(\d+)\s+(\d{1,2}\.\s*[A-ZÄÖÜ][a-zäöü]{2,4}\.?\s*\d{4})$/;
// Direkt unter "Übersicht für <Rufnummer>" steht bei Drei/H3G immer eine
// Zeile wie "Handy,Riegler Waltraud" – Tarif-/Kategoriewort, Komma, Name.
const NAME_ZEILE = /^[A-Za-zÄÖÜäöüß]+,\s*(.+)$/;

type Section = "main" | "nichtInkludiert" | null;

function lineItemName(line: string): string {
  const parenMatch = line.match(/\(\s*\d{1,2}\.\s*[A-ZÄÖÜ][a-zäöü]{2,4}\.?\s*\d{4}\s*-/);
  const cut = parenMatch ? line.slice(0, parenMatch.index) : line;
  const amountMatch = cut.match(TRAILING_NETTO_TAX_BRUTTO);
  const name = amountMatch ? cut.slice(0, amountMatch.index) : cut;
  return name.trim();
}

export function parseDrei(pages: PdfLine[][]): ParsedInvoice {
  const lines = pagesToLineStrings(pages);

  let kundennummer: string | null = null;
  let rechnungsnummer: string | null = null;
  let rechnungsdatum: string | null = null;
  for (const line of lines) {
    const match = line.match(RECHNUNG_HEADER_VALUES);
    if (match) {
      kundennummer = match[1];
      rechnungsnummer = match[2];
      rechnungsdatum = parseGermanShortDate(match[3]);
      break;
    }
  }

  const positionen = new Map<string, ParsedPosition>();

  let currentPosition: ParsedPosition | null = null;
  let section: Section = null;
  let zeitraumCaptured = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const uebersichtMatch = line.match(UEBERSICHT_HEADER);
    if (uebersichtMatch) {
      const normalisiert = normalisiereRufnummer(uebersichtMatch[3]);
      if (istPlausibleRufnummer(normalisiert)) {
        currentPosition =
          positionen.get(normalisiert) ??
          makePosition(normalisiert, uebersichtMatch[3]);
        positionen.set(normalisiert, currentPosition);
        section = "main";
        zeitraumCaptured = Boolean(currentPosition.abrechnungszeitraum);

        if (!currentPosition.nameAusRechnung) {
          const nameMatch = lines[idx + 1]?.match(NAME_ZEILE);
          if (nameMatch) currentPosition.nameAusRechnung = nameMatch[1].trim();
        }
      } else {
        currentPosition = null;
        section = null;
      }
      continue;
    }

    const detailMatch = line.match(DETAILUEBERSICHT_HEADER);
    if (detailMatch) {
      section = currentPosition ? "main" : null;
      continue;
    }

    if (currentPosition === null) continue;

    if (!zeitraumCaptured) {
      const periodMatch = line.match(
        /\(\s*(\d{1,2}\.\s*[A-ZÄÖÜ][a-zäöü]{2,4}\.?\s*\d{4}\s*-\s*\d{1,2}\.\s*[A-ZÄÖÜ][a-zäöü]{2,4}\.?\s*\d{4})\s*\)/,
      );
      if (periodMatch) {
        currentPosition.abrechnungszeitraum = periodMatch[1].replace(/\s+/g, " ").trim();
        zeitraumCaptured = true;
      }
    }

    if (/^Nicht inkludiert \/ kostenpflichtig/.test(line)) {
      section = "nichtInkludiert";
      continue;
    }
    if (/^(Innerhalb und kostenlos|Summe)(\s|$)/.test(line)) {
      section = section === "nichtInkludiert" ? null : section;
      continue;
    }

    if (section === null) continue;

    const amountMatch = line.match(TRAILING_NETTO_TAX_BRUTTO);
    if (!amountMatch) continue;

    const netto = parseAmount(amountMatch[1]);
    const rate = amountMatch[2] ? Number.parseInt(amountMatch[2], 10) : null;
    const name = lineItemName(line);
    if (!name) continue;

    if (section === "nichtInkludiert") {
      if (netto !== 0) addBemerkung(currentPosition, name);
      continue;
    }

    if (/^Nutzungsentgelte(\s|$)/.test(name)) {
      if (netto !== 0) {
        currentPosition.verbindungsentgelte_20 += netto;
      }
      continue;
    }

    if (/^Dienste von Drittanbietern/.test(name)) {
      if (netto === 0) continue;
      if (rate === 20) currentPosition.drittanbieter_20 += netto;
      else currentPosition.drittanbieter_0 += netto;
      addBemerkung(currentPosition, name);
      continue;
    }

    if (/^(Entgelte f(ü|u)r Online Dienste|Online Dienste|Downloads)/.test(name)) {
      if (netto === 0) continue;
      if (rate === 20) currentPosition.online_dienste_20 += netto;
      else currentPosition.online_dienste_0 += netto;
      addBemerkung(currentPosition, name);
    }
  }

  return {
    anbieter: "Drei",
    rechnungsnummer,
    rechnungsdatum,
    ban: kundennummer,
    positionen: Array.from(positionen.values()),
  };
}
