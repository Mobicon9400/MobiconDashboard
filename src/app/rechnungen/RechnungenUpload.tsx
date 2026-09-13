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
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;

    startUpload(async () => {
      for (const file of Array.from(files)) {
        setStatus(`Verarbeite ${file.name}…`);
        const formData = new FormData();
        formData.append("datei", file);
        const res = await fetch("/api/rechnungen/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(`Fehler bei ${file.name}: ${data.error}`);
          return;
        }
        setStatus(
          `${file.name}: ${data.anbieter} erkannt, ${data.anzahlPositionen} Rufnummern für ${data.monat} verarbeitet.`,
        );
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        className="text-sm"
      />
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
