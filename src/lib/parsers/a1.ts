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

const AMOUNT_AT_END = /(-?\d[\d.]*,\d{2})\s*$/;
const RUFNUMMER_HEADER = /^(.*?)\s*Rufnummer\s+(\d{3,4}\/\d{5,9})\s*$/;

type Category = "verbindungen" | "online" | "dritte" | null;

function lineItemName(line: string): string {
  const dateMatch = line.match(/\d{2}\.\d{2}\.\d{4}/);
  const cut = dateMatch ? line.slice(0, dateMatch.index) : line;
  const amountMatch = cut.match(AMOUNT_AT_END);
  let name = amountMatch ? cut.slice(0, amountMatch.index) : cut;
  name = name.replace(/\d{1,2}\s?%\s*$/, "");
  return name.trim();
}

function taxRateNear(line: string): number | null {
  const withoutAmount = line.replace(AMOUNT_AT_END, "");
  const matches = [...withoutAmount.matchAll(/(\d{1,2})\s?%/g)];
  if (matches.length === 0) return null;
  return Number.parseInt(matches[matches.length - 1][1], 10);
}

export function parseA1(pages: PdfLine[][]): ParsedInvoice {
  const lines = pagesToLineStrings(pages);

  const rechnungsnummerMatch = lines
    .map((l) => l.match(/Rechnungsnummer:\s*(\d+)/))
    .find(Boolean);
  const rechnungsdatumMatch = lines
    .map((l) => l.match(/Rechnungsdatum:\s*(\d{1,2}\.\d{1,2}\.\d{4})/))
    .find(Boolean);
  const abrechnungszeitraumMatch = lines
    .map((l) => l.match(/Abrechnungszeitraum:\s*([\d.]+\s*-\s*[\d.]+)/))
    .find(Boolean);
  const vertragsnummerMatch = lines
    .map((l) => l.match(/Vertragsnummer:\s*(\d+(?:\s*\/\s*\d+)?)/))
    .find(Boolean);

  const abrechnungszeitraum = abrechnungszeitraumMatch
    ? abrechnungszeitraumMatch[1].replace(/\s+/g, " ").trim()
    : "";

  const positionen = new Map<string, ParsedPosition>();

  let currentPosition: ParsedPosition | null = null;
  let category: Category = null;

  for (const line of lines) {
    if (line.startsWith("Ihre Detailinformation zu")) {
      currentPosition = null;
      category = null;
      continue;
    }

    if (currentPosition === null) {
      const headerMatch = line.match(RUFNUMMER_HEADER);
      if (headerMatch) {
        const rufnummerAnzeige = headerMatch[2];
        const normalisiert = normalisiereRufnummer(rufnummerAnzeige);
        if (istPlausibleRufnummer(normalisiert)) {
          currentPosition =
            positionen.get(normalisiert) ??
            makePosition(normalisiert, rufnummerAnzeige);
          currentPosition.abrechnungszeitraum = abrechnungszeitraum;
          positionen.set(normalisiert, currentPosition);
        }
      }
      continue;
    }

    if (line.startsWith("Summe ")) {
      category = null;
      continue;
    }

    if (/^Verbindungsentgelte(\s|$)/.test(line)) {
      category = "verbindungen";
      continue;
    }
    if (/^Entgelte Online Dienste und Downloads/.test(line)) {
      category = "online";
      continue;
    }
    if (/^Zahlungen an A1/.test(line)) {
      category = "dritte";
      continue;
    }
    if (
      /^(Gutschriften|Monatliche Entgelte|Jährliche Entgelte|Einmalige Entgelte)(\s|$)/.test(
        line,
      )
    ) {
      category = null;
      continue;
    }
    if (/^Mobilpoints/.test(line) || /^Zeitraum \d/.test(line)) {
      continue;
    }

    if (category === null) continue;

    const amountMatch = line.match(AMOUNT_AT_END);
    if (!amountMatch) continue;

    const amount = parseAmount(amountMatch[1]);
    if (amount === 0) continue;

    const rate = taxRateNear(line);
    const name = lineItemName(line);
    if (!name) continue;

    if (category === "verbindungen") {
      currentPosition.verbindungsentgelte_20 += amount;
      addBemerkung(currentPosition, name);
    } else if (category === "online") {
      if (rate === 20) currentPosition.online_dienste_20 += amount;
      else currentPosition.online_dienste_0 += amount;
      addBemerkung(currentPosition, name);
    } else if (category === "dritte") {
      if (rate === 20) currentPosition.drittanbieter_20 += amount;
      else currentPosition.drittanbieter_0 += amount;
      addBemerkung(currentPosition, name);
    }
  }

  return {
    anbieter: "A1",
    rechnungsnummer: rechnungsnummerMatch ? rechnungsnummerMatch[1] : null,
    rechnungsdatum: rechnungsdatumMatch
      ? parseGermanDate(rechnungsdatumMatch[1])
      : null,
    ban: vertragsnummerMatch ? vertragsnummerMatch[1].replace(/\s+/g, " ").trim() : null,
    positionen: Array.from(positionen.values()),
  };
}
