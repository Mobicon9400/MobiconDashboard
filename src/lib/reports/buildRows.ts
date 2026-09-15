import type { MonatsRow, ReportRow } from "./types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toReportRow(row: MonatsRow): ReportRow {
  return {
    name: row.name ?? "",
    rufnummer: row.rufnummer_anzeige,
    ban: row.ban ?? "",
    verbindungsentgelte_20: row.verbindungsentgelte_20,
    drittanbieter_20: row.drittanbieter_20,
    drittanbieter_0: row.drittanbieter_0,
    online_dienste_20: row.online_dienste_20,
    online_dienste_0: row.online_dienste_0,
    steuer: row.steuer,
    gesamtsumme: row.gesamtsumme,
    abrechnungszeitraum: row.abrechnungszeitraum ?? "",
    rechnungsnummer: row.rechnungsnummer ?? "",
    netzbetreiber: row.netzbetreiber ?? "",
    bemerkungen: row.bemerkungen ?? "",
    istSummenzeile: false,
  };
}

/**
 * Sortiert nach Name, listet jede Rufnummer einzeln und fügt nach jeder
 * Gruppe mit mehr als einer Rufnummer eine reine Namens-Summenzeile ein.
 */
export function buildReportRows(monatsRows: MonatsRow[]): ReportRow[] {
  const sorted = [...monatsRows].sort((a, b) => {
    const nameA = a.name ?? "￿";
    const nameB = b.name ?? "￿";
    if (nameA !== nameB) return nameA.localeCompare(nameB, "de-AT");
    return a.rufnummer_anzeige.localeCompare(b.rufnummer_anzeige);
  });

  const rows: ReportRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    const name = sorted[i].name;
    const gruppe: MonatsRow[] = [];
    while (i < sorted.length && sorted[i].name === name) {
      gruppe.push(sorted[i]);
      i++;
    }

    for (const eintrag of gruppe) {
      rows.push(toReportRow(eintrag));
    }

    if (name && gruppe.length > 1) {
      rows.push({
        name,
        rufnummer: "",
        ban: "",
        verbindungsentgelte_20: round2(sum(gruppe, "verbindungsentgelte_20")),
        drittanbieter_20: round2(sum(gruppe, "drittanbieter_20")),
        drittanbieter_0: round2(sum(gruppe, "drittanbieter_0")),
        online_dienste_20: round2(sum(gruppe, "online_dienste_20")),
        online_dienste_0: round2(sum(gruppe, "online_dienste_0")),
        steuer: round2(sum(gruppe, "steuer")),
        gesamtsumme: round2(sum(gruppe, "gesamtsumme")),
        abrechnungszeitraum: "",
        rechnungsnummer: "",
        netzbetreiber: "",
        bemerkungen: "",
        istSummenzeile: true,
      });
    }
  }

  return rows;
}

function sum(rows: MonatsRow[], field: keyof MonatsRow): number {
  return rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
}
