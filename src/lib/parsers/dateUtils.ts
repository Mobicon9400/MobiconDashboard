/** "25.08.2026" -> "2026-08-25" */
export function parseGermanDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const GERMAN_MONTHS: Record<string, string> = {
  "Jän.": "01",
  "Jan.": "01",
  "Feb.": "02",
  "März": "03",
  "Mär.": "03",
  "Apr.": "04",
  "Mai": "05",
  "Juni": "06",
  "Jun.": "06",
  "Juli": "07",
  "Jul.": "07",
  "Aug.": "08",
  "Sep.": "09",
  "Okt.": "10",
  "Nov.": "11",
  "Dez.": "12",
};

/** "3. Feb. 2026" -> "2026-02-03" (Drei's invoice-date format) */
export function parseGermanShortDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\.\s*([A-ZÄÖÜ][a-zäöü]{2,4}\.?)\s*(\d{4})/);
  if (!match) return null;
  const [, day, monthRaw, year] = match;
  const month = GERMAN_MONTHS[monthRaw] ?? GERMAN_MONTHS[monthRaw + "."];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/** Monat-Bucket "YYYY-MM" aus einem ISO-Datum */
export function monatVonDatum(isoDate: string): string {
  return isoDate.slice(0, 7);
}
