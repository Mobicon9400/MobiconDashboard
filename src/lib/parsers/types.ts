export interface ParsedPosition {
  rufnummer_normalisiert: string;
  rufnummer_anzeige: string;
  verbindungsentgelte_20: number;
  drittanbieter_20: number;
  drittanbieter_0: number;
  online_dienste_20: number;
  online_dienste_0: number;
  abrechnungszeitraum: string;
  bemerkungen: string;
}

export interface ParsedInvoice {
  anbieter: "A1" | "Magenta" | "Drei";
  rechnungsnummer: string | null;
  rechnungsdatum: string | null;
  /** Kundennummer/BAN vom Rechnungskopf, gilt für alle Positionen dieser Rechnung. */
  kundennummer: string | null;
  positionen: ParsedPosition[];
}

/** Parses "1.234,56" / "-12,34" / "12.34" style amounts to a number. */
export function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Extracts a trailing "NN%" tax-rate token, or null if none is present. */
export function extractTaxRate(line: string): number | null {
  const match = line.match(/(\d{1,2})\s?%/);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function makePosition(
  rufnummer_normalisiert: string,
  rufnummer_anzeige: string,
): ParsedPosition {
  return {
    rufnummer_normalisiert,
    rufnummer_anzeige,
    verbindungsentgelte_20: 0,
    drittanbieter_20: 0,
    drittanbieter_0: 0,
    online_dienste_20: 0,
    online_dienste_0: 0,
    abrechnungszeitraum: "",
    bemerkungen: "",
  };
}

export function addBemerkung(position: ParsedPosition, name: string) {
  const existing = position.bemerkungen
    ? position.bemerkungen.split(", ").filter(Boolean)
    : [];
  if (!existing.includes(name)) {
    existing.push(name);
  }
  position.bemerkungen = existing.join(", ");
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
