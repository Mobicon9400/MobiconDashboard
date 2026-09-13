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
import { parseGermanDate } from "./dateUtils";

const RUFNUMMER_LINE = /^0\d{2,3}(?:\s\d{1,4}){2,4}$/;
const TWO_TRAILING_AMOUNTS = /(-?\d[\d.]*,\d{2})\s+(-?\d[\d.]*,\d{2})\s*$/;
const VERBINDUNGEN_HEADER = /^Ihre Verbindungen und Dienste\s+([\d.]+\s*-\s*[\d.]+)/;

type Category = "verbindungen" | "online" | "dritte" | null;

function lineItemName(line: string): string {
  const dateMatch = line.match(/\d{1,2}\.\d{1,2}\.\d{4}/);
  const cut = dateMatch ? line.slice(0, dateMatch.index) : line;
  const amountMatch = cut.match(TWO_TRAILING_AMOUNTS);
  let name = amountMatch ? cut.slice(0, amountMatch.index) : cut;
  name = name.replace(/\d{1,2}\s?%\s*$/, "");
  return name.trim();
}

function taxRateNear(line: string): number | null {
  const withoutAmounts = line.replace(TWO_TRAILING_AMOUNTS, "");
  const matches = [...withoutAmounts.matchAll(/(\d{1,2})\s?%/g)];
  if (matches.length === 0) return null;
  return Number.parseInt(matches[matches.length - 1][1], 10);
}

function addZeitraum(position: ParsedPosition, zeitraum: string) {
  const existing = position.abrechnungszeitraum
    ? position.abrechnungszeitraum.split(" | ").filter(Boolean)
    : [];
  if (!existing.includes(zeitraum)) existing.push(zeitraum);
  position.abrechnungszeitraum = existing.join(" | ");
}

export function parseMagenta(pages: PdfLine[][]): ParsedInvoice {
  const lines = pagesToLineStrings(pages);

  const rechnungsnummerMatch = lines
    .map((l) => l.match(/Rechnungsnummer\s+(\d+)/))
    .find(Boolean);
  const rechnungsdatumMatch = lines
    .map((l) => l.match(/Rechnungsdatum\s+(\d{1,2}\.\d{1,2}\.\d{4})/))
    .find(Boolean);
  const kundennummerMatch = lines
    .map((l) => l.match(/Kundennummer\s+([\d.]+)/))
    .find(Boolean);

  const positionen = new Map<string, ParsedPosition>();

  let currentPosition: ParsedPosition | null = null;
  let category: Category = null;

  for (const line of lines) {
    const rufnummerMatch = line.match(RUFNUMMER_LINE);
    if (rufnummerMatch) {
      const normalisiert = normalisiereRufnummer(line);
      if (istPlausibleRufnummer(normalisiert)) {
        currentPosition =
          positionen.get(normalisiert) ?? makePosition(normalisiert, line);
        positionen.set(normalisiert, currentPosition);
        category = null;
        continue;
      }
    }

    if (currentPosition === null) continue;

    if (line.startsWith("Summe ")) {
      category = null;
      continue;
    }

    const verbindungenMatch = line.match(VERBINDUNGEN_HEADER);
    if (verbindungenMatch) {
      category = "verbindungen";
      addZeitraum(currentPosition, verbindungenMatch[1].replace(/\s+/g, " ").trim());
      continue;
    }
    if (/^(Entgelte f(ü|u)r Online Dienste|Ihre Downloads)/.test(line)) {
      category = "online";
      continue;
    }
    if (/^(Ihre Drittanbieterleistungen|Zahlungen an .* Dritte)/.test(line)) {
      category = "dritte";
      continue;
    }
    if (
      /^(Ihre monatliche Grundgeb(ü|u)hr|Ihr monatlicher Paketpreis|Weitere Leistungen & Geb(ü|u)hren)(\s|$)/.test(
        line,
      )
    ) {
      category = null;
      continue;
    }
    if (
      /^(Ihre Freieinheiten|Nutzung|Daten|SMS & MMS im Inland|Datendienste im Inland|Anzahl|Dauer)$/.test(
        line,
      )
    ) {
      continue;
    }

    if (category === null) continue;

    const amountMatch = line.match(TWO_TRAILING_AMOUNTS);
    if (!amountMatch) continue;

    const netto = parseAmount(amountMatch[1]);
    if (netto === 0) continue;

    const rate = taxRateNear(line);
    const name = lineItemName(line);
    if (!name) continue;

    if (category === "verbindungen") {
      currentPosition.verbindungsentgelte_20 += netto;
      addBemerkung(currentPosition, name);
    } else if (category === "online") {
      if (rate === 20) currentPosition.online_dienste_20 += netto;
      else currentPosition.online_dienste_0 += netto;
      addBemerkung(currentPosition, name);
    } else if (category === "dritte") {
      if (rate === 20) currentPosition.drittanbieter_20 += netto;
      else currentPosition.drittanbieter_0 += netto;
      addBemerkung(currentPosition, name);
    }
  }

  return {
    anbieter: "Magenta",
    rechnungsnummer: rechnungsnummerMatch ? rechnungsnummerMatch[1] : null,
    rechnungsdatum: rechnungsdatumMatch
      ? parseGermanDate(rechnungsdatumMatch[1])
      : null,
    kundennummer: kundennummerMatch ? kundennummerMatch[1] : null,
    positionen: Array.from(positionen.values()),
  };
}
