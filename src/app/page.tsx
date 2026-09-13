import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Any structured response from the Supabase REST endpoint (including a
  // "table not found" error) proves connectivity; only a thrown network
  // error means the connection itself failed.
  let connected = true;
  try {
    await supabase.from("_realtime_check_").select("*").limit(1);
  } catch {
    connected = false;
  }

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
    </div>
  );
}
