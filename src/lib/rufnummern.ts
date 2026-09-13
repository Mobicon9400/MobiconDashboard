export function normalisiereRufnummer(raw: string): string {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("43") && digits.length > 10) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

export function istPlausibleRufnummer(digits: string): boolean {
  return digits.length >= 7 && digits.length <= 15;
}

export const ANBIETER_NACH_SHEET: Record<string, "A1" | "Drei" | "Magenta"> = {
  "Bus und Comp": "A1",
  H3G: "Drei",
  Magenta: "Magenta",
};
