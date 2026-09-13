"use client";

import { useState, useTransition } from "react";

interface MonatEintrag {
  monat: string;
  aktuellerMonat: boolean;
  berichtVorhanden: boolean;
}

export function BerichteTable({ monate }: { monate: MonatEintrag[] }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [berichteVorhanden, setBerichteVorhanden] = useState<Record<string, boolean>>(
    Object.fromEntries(monate.map((m) => [m.monat, m.berichtVorhanden])),
  );
  const [isPending, startTransition] = useTransition();

  function generiere(monat: string) {
    startTransition(async () => {
      setStatus((s) => ({ ...s, [monat]: "Erstelle Bericht…" }));
      const res = await fetch("/api/berichte/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monat }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus((s) => ({ ...s, [monat]: `Fehler: ${data.error}` }));
        return;
      }
      setBerichteVorhanden((v) => ({ ...v, [monat]: true }));
      setStatus((s) => ({
        ...s,
        [monat]: `Fertig (${data.anzahlRufnummern} Rufnummern).`,
      }));
    });
  }

  async function herunterladen(monat: string, format: "pdf" | "xlsx") {
    const res = await fetch(`/api/berichte/download?monat=${monat}&format=${format}`);
    const data = await res.json();
    if (!res.ok) {
      setStatus((s) => ({ ...s, [monat]: `Fehler: ${data.error}` }));
      return;
    }
    window.open(data.url, "_blank");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {monate.map((m) => (
        <div
          key={m.monat}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-mobicon-dark">
                {m.monat}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  m.aktuellerMonat
                    ? "bg-amber-50 text-amber-700"
                    : "bg-mobicon-green/10 text-mobicon-green-dark"
                }`}
              >
                {m.aktuellerMonat ? "laufender Monat" : "abgeschlossen"}
              </span>
            </div>
            {status[m.monat] && (
              <p className="mt-1 text-sm text-zinc-600">{status[m.monat]}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generiere(m.monat)}
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
            >
              {berichteVorhanden[m.monat] ? "Bericht aktualisieren" : "Bericht erstellen"}
            </button>
            {berichteVorhanden[m.monat] && (
              <>
                <button
                  onClick={() => herunterladen(m.monat, "pdf")}
                  className="rounded-md bg-mobicon-dark px-3 py-1.5 text-sm font-medium text-white hover:bg-mobicon-dark/90"
                >
                  PDF
                </button>
                <button
                  onClick={() => herunterladen(m.monat, "xlsx")}
                  className="rounded-md bg-mobicon-green px-3 py-1.5 text-sm font-medium text-white hover:bg-mobicon-green-dark"
                >
                  Excel
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      {monate.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Noch keine Rechnungen hochgeladen — Berichte erscheinen hier, sobald
          Daten vorhanden sind.
        </div>
      )}
    </div>
  );
}
