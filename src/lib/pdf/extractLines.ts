import "server-only";

export interface PdfLine {
  y: number;
  text: string;
}

/**
 * pdfjs emits text items in content-stream order, which for these carrier
 * invoices is not left-to-right reading order (columns can come before the
 * row label). Reconstruct rows by grouping items on the same baseline (y)
 * and sorting them left-to-right by x.
 */
export async function extractPdfLines(buffer: ArrayBuffer): Promise<PdfLine[][]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pages: PdfLine[][] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    type Item = { x: number; y: number; str: string };
    const items: Item[] = content.items
      .map((item) => {
        const it = item as { str: string; transform: number[] };
        return { x: it.transform[4], y: Math.round(it.transform[5]), str: it.str };
      })
      .filter((it) => it.str.trim().length > 0);

    const rows = new Map<number, Item[]>();
    for (const item of items) {
      let bucketY = item.y;
      for (const existingY of rows.keys()) {
        if (Math.abs(existingY - item.y) <= 2) {
          bucketY = existingY;
          break;
        }
      }
      if (!rows.has(bucketY)) rows.set(bucketY, []);
      rows.get(bucketY)!.push(item);
    }

    const lines: PdfLine[] = Array.from(rows.entries())
      .map(([y, rowItems]) => {
        rowItems.sort((a, b) => a.x - b.x);
        const text = rowItems
          .map((it) => it.str.trim())
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        return { y, text };
      })
      .filter((line) => line.text.length > 0)
      .sort((a, b) => b.y - a.y);

    pages.push(lines);
  }

  return pages;
}

export function pagesToLineStrings(pages: PdfLine[][]): string[] {
  return pages.flatMap((page) => page.map((line) => line.text));
}
