import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Nur ein winziger JSON-Request - der eigentliche Datei-Upload geht danach
// direkt vom Browser zu Supabase Storage, nicht durch diese Funktion.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const dateiname = body?.dateiname;

  if (typeof dateiname !== "string" || !dateiname) {
    return NextResponse.json({ error: "Kein Dateiname übergeben." }, { status: 400 });
  }

  const pfad = `pending/${crypto.randomUUID()}-${dateiname}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("rechnungen")
    .createSignedUploadUrl(pfad);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Signierte Upload-URL konnte nicht erstellt werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
