import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = await createClient();
  const { error } = await supabase.from("_realtime_check_").select("*").limit(1);
  // A missing-table error still proves the Supabase connection itself works.
  const connected = !error || error.code === "42P01";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        MobiconDashboard
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Supabase:{" "}
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "verbunden" : "nicht verbunden"}
        </span>
      </p>
      {!connected && (
        <div className="max-w-lg rounded border border-red-300 bg-red-50 p-4 text-left text-sm text-red-800">
          <p>NEXT_PUBLIC_SUPABASE_URL gesetzt: {String(hasUrl)}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY gesetzt: {String(hasKey)}</p>
          <p>Fehlercode: {error?.code ?? "(keiner)"}</p>
          <p>Fehlermeldung: {error?.message ?? "(keine)"}</p>
        </div>
      )}
    </div>
  );
}
