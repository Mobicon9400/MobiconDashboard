"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const ANBIETER_FARBEN: Record<string, string> = {
  A1: "bg-red-50 text-red-700",
  Magenta: "bg-pink-50 text-pink-700",
  Drei: "bg-orange-50 text-orange-700",
};

export function RechnungenUpload() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadEineDatei(
    file: File,
    versuch: number,
  ): Promise<{ ok: true } | { ok: false; fehler: string }> {
    try {
      const formData = new FormData();
      formData.append("datei", file);
      const res = await fetch("/api/rechnungen/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, fehler: data.error };
      return { ok: true };
    } catch {
      // Kurzer Netzwerk-Aussetzer (WLAN beim Kunden) reicht sonst schon,
      // um eine Datei aus einem großen Batch als "fehlgeschlagen" zu melden.
      if (versuch < 2) {
        await new Promise((r) => setTimeout(r, 1500));
        return uploadEineDatei(file, versuch + 1);
      }
      return { ok: false, fehler: "Verbindung fehlgeschlagen (auch nach Wiederholung)." };
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setStatus("Bitte zuerst eine oder mehrere PDF-Dateien auswählen.");
      return;
    }

    startUpload(async () => {
      const alle = Array.from(files);
      const fehler: string[] = [];
      let erfolgreich = 0;

      for (let i = 0; i < alle.length; i++) {
        const file = alle[i];
        setStatus(`Verarbeite ${i + 1}/${alle.length}: ${file.name}…`);
        const ergebnis = await uploadEineDatei(file, 0);
        if (ergebnis.ok) {
          erfolgreich++;
        } else {
          fehler.push(`${file.name}: ${ergebnis.fehler}`);
        }
      }

      setStatus(
        fehler.length === 0
          ? `${erfolgreich} von ${alle.length} Rechnung(en) erfolgreich verarbeitet.`
          : `${erfolgreich} von ${alle.length} erfolgreich. Fehler bei: ${fehler.join("; ")}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFileNames([]);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleUpload}
      className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(e) =>
          setSelectedFileNames(Array.from(e.target.files ?? []).map((f) => f.name))
        }
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
      >
        Datei(en) auswählen
      </button>
      <span className="text-sm text-zinc-500">
        {selectedFileNames.length > 0
          ? selectedFileNames.join(", ")
          : "Keine Datei ausgewählt"}
      </span>
      <button
        type="submit"
        disabled={isUploading}
        className="rounded-md bg-mobicon-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-mobicon-green-dark disabled:opacity-60"
      >
        {isUploading ? "Verarbeite…" : "PDF-Rechnung(en) hochladen"}
      </button>
      {status && <p className="text-sm text-zinc-600">{status}</p>}
    </form>
  );
}

export { ANBIETER_FARBEN };
