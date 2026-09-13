"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Rufnummer = {
  id: string;
  rufnummer_normalisiert: string;
  rufnummer_anzeige: string;
  name: string;
  anbieter: "A1" | "Magenta" | "Drei" | null;
  ban: string | null;
  erwarteter_betrag: number | null;
  aktiv: boolean;
};

const ANBIETER_FARBEN: Record<string, string> = {
  A1: "bg-red-50 text-red-700",
  Magenta: "bg-pink-50 text-pink-700",
  Drei: "bg-orange-50 text-orange-700",
};

export function RufnummernTable({ initialRows }: { initialRows: Rufnummer[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadStatus("Bitte zuerst eine Excel-Datei auswählen.");
      return;
    }

    const formData = new FormData();
    formData.append("datei", file);

    startUpload(async () => {
      setUploadStatus("Import läuft…");
      const res = await fetch("/api/rufnummern/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadStatus(`Fehler: ${data.error}`);
        return;
      }
      setUploadStatus(
        `${data.importiert} Rufnummern importiert (${data.verarbeiteteSheets.join(", ")}).`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFileName(null);
      router.refresh();
    });
  }

  async function handleFieldUpdate(
    id: string,
    field: "name" | "ban" | "erwarteter_betrag",
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === "erwarteter_betrag" ? (value === "" ? null : Number(value)) : value,
            }
          : row,
      ),
    );
    await fetch(`/api/rufnummern/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Diese Rufnummer wirklich löschen?")) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
    await fetch(`/api/rufnummern/${id}`, { method: "DELETE" });
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/rufnummern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowAddForm(false);
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Fehler beim Anlegen.");
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Datei auswählen
          </button>
          <span className="text-sm text-zinc-500">
            {selectedFileName ?? "Keine Datei ausgewählt"}
          </span>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-mobicon-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-mobicon-green-dark disabled:opacity-60"
          >
            {isUploading ? "Importiere…" : "Excel importieren"}
          </button>
        </form>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          {showAddForm ? "Abbrechen" : "+ Manuell hinzufügen"}
        </button>
        {uploadStatus && <p className="text-sm text-zinc-600">{uploadStatus}</p>}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Rufnummer
            <input name="rufnummer_anzeige" required className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Name
            <input name="name" required className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Anbieter
            <select name="anbieter" required className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm">
              <option value="A1">A1</option>
              <option value="Magenta">Magenta</option>
              <option value="Drei">Drei</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            BAN
            <input name="ban" className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Erwarteter Betrag (€)
            <input name="erwarteter_betrag" type="number" step="0.01" className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
          </label>
          <button type="submit" className="rounded-md bg-mobicon-dark px-3 py-1.5 text-sm font-medium text-white">
            Hinzufügen
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Rufnummer</th>
              <th className="px-3 py-2">Anbieter</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">BAN</th>
              <th className="px-3 py-2">Erwarteter Betrag</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-zinc-700">
                  {row.rufnummer_anzeige}
                </td>
                <td className="px-3 py-2">
                  {row.anbieter && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${ANBIETER_FARBEN[row.anbieter]}`}
                    >
                      {row.anbieter}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={row.name}
                    onBlur={(e) => handleFieldUpdate(row.id, "name", e.target.value)}
                    className="w-full rounded border border-transparent px-1 py-0.5 hover:border-zinc-300 focus:border-mobicon-green focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={row.ban ?? ""}
                    onBlur={(e) => handleFieldUpdate(row.id, "ban", e.target.value)}
                    className="w-full rounded border border-transparent px-1 py-0.5 font-mono text-xs hover:border-zinc-300 focus:border-mobicon-green focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={row.erwarteter_betrag ?? ""}
                    onBlur={(e) =>
                      handleFieldUpdate(row.id, "erwarteter_betrag", e.target.value)
                    }
                    className="w-24 rounded border border-transparent px-1 py-0.5 hover:border-zinc-300 focus:border-mobicon-green focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-xs text-zinc-400 hover:text-red-600"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-400">
                  Noch keine Rufnummern. Excel-Datei importieren oder manuell hinzufügen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
