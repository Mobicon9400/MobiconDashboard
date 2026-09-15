import ExcelJS from "exceljs";
import { REPORT_SPALTEN, type ReportRow } from "./types";

export async function buildExcelBericht(monat: string, rows: ReportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Bericht ${monat}`, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: REPORT_SPALTEN[0], key: "name", width: 26 },
    { header: REPORT_SPALTEN[1], key: "rufnummer", width: 16 },
    { header: REPORT_SPALTEN[2], key: "ban", width: 14 },
    { header: REPORT_SPALTEN[3], key: "verbindungsentgelte_20", width: 16 },
    { header: REPORT_SPALTEN[4], key: "drittanbieter_20", width: 18 },
    { header: REPORT_SPALTEN[5], key: "drittanbieter_0", width: 18 },
    { header: REPORT_SPALTEN[6], key: "online_dienste_20", width: 18 },
    { header: REPORT_SPALTEN[7], key: "online_dienste_0", width: 18 },
    { header: REPORT_SPALTEN[8], key: "steuer", width: 12 },
    { header: REPORT_SPALTEN[9], key: "gesamtsumme", width: 16 },
    { header: REPORT_SPALTEN[10], key: "abrechnungszeitraum", width: 26 },
    { header: REPORT_SPALTEN[11], key: "rechnungsnummer", width: 18 },
    { header: REPORT_SPALTEN[12], key: "netzbetreiber", width: 14 },
    { header: REPORT_SPALTEN[13], key: "bemerkungen", width: 40 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2D3E4F" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  const geldSpalten = [
    "verbindungsentgelte_20",
    "drittanbieter_20",
    "drittanbieter_0",
    "online_dienste_20",
    "online_dienste_0",
    "steuer",
    "gesamtsumme",
  ] as const;

  for (const row of rows) {
    const excelRow = sheet.addRow(row);
    for (const key of geldSpalten) {
      excelRow.getCell(key).numFmt = '#,##0.00 "€"';
    }
    if (row.istSummenzeile) {
      excelRow.font = { bold: true };
      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F4E8" },
      };
    }
  }

  sheet.autoFilter = { from: "A1", to: "N1" };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
