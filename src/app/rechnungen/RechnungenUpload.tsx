"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";

const ANBIETER_FARBEN: Record<string, string> = {
  A1: "bg-red-50 text-red-700",
  Magenta: "bg-pink-50 text-pink-700",
  Drei: "bg-orange-50 text-orange-700",
};

const PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];

// Standard-Uploads (fetch/PUT auf die signierte URL) gelten laut Supabase
// selbst offiziell erst ab 6MB als "weniger zuverlässig" - bei größeren
// Rechnungen über eine instabile Kundenverbindung reißt der Upload sonst
// ohne Wiederaufnahme komplett ab. TUS lädt in 6MB-Blöcken hoch und kann
// nach einem Abbruch dort weitermachen, wo er aufgehört hat.
function uploadViaTus(file: File, path: string, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "x-signature": token,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "rechnungen",
        objectName: path,
        contentType: "application/pdf",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onSuccess: () => resolve(),
    });
    upload.findPreviousUploads().then((vorherige) => {
      if (vorherige.length > 0) upload.resumeFromPreviousUpload(vorherige[0]);
      upload.start();
    });
  });
}

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
      // Große Rechnungen (>4-5MB) überschreiten sonst das Limit für
      // Vercel-Funktions-Requests. Die Datei geht deshalb direkt vom Browser
      // zu Supabase Storage; unsere Funktion bekommt nur noch den Pfad.
      const urlRes = await fetch("/api/rechnungen/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateiname: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) return { ok: false, fehler: urlData.error };

      await uploadViaTus(file, urlData.path, urlData.token);

      const res = await fetch("/api/rechnungen/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: urlData.path, dateiname: file.name }),
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
