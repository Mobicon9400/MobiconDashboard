export interface MonatsRow {
  rufnummer_normalisiert: string;
  rufnummer_anzeige: string;
  name: string | null;
  ban: string | null;
  verbindungsentgelte_20: number;
  drittanbieter_20: number;
  drittanbieter_0: number;
  online_dienste_20: number;
  online_dienste_0: number;
  steuer: number;
  gesamtsumme: number;
  abrechnungszeitraum: string | null;
  rechnungsnummer: string | null;
  netzbetreiber: string | null;
  bemerkungen: string | null;
}

export interface ReportRow {
  name: string;
  rufnummer: string;
  ban: string;
  verbindungsentgelte_20: number;
  drittanbieter_20: number;
  drittanbieter_0: number;
  online_dienste_20: number;
  online_dienste_0: number;
  steuer: number;
  gesamtsumme: number;
  abrechnungszeitraum: string;
  rechnungsnummer: string;
  netzbetreiber: string;
  bemerkungen: string;
  istSummenzeile: boolean;
}

export const REPORT_SPALTEN = [
  "Name",
  "Rufnummer",
  "BAN",
  "Verbindungsentgelte (20%)",
  "Zahlungen an A1/Dritte (20%)",
  "Zahlungen an A1/Dritte (0%)",
  "Online-Dienste/Downloads (20%)",
  "Online-Dienste/Downloads (0%)",
  "Steuer",
  "Gesamtsumme inkl. Steuer",
  "Abrechnungszeitraum",
  "Rechnungsnummer",
  "Netzbetreiber",
  "Bemerkungen",
] as const;
