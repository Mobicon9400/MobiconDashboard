import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monat = searchParams.get("monat");
  const format = searchParams.get("format");

  if (!monat || (format !== "pdf" && format !== "xlsx")) {
    return NextResponse.json({ error: "Ungültige Parameter." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const pfad = `${monat}/bericht.${format}`;

  const { data, error } = await supabase.storage
    .from("reports")
    .createSignedUrl(pfad, 60);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Bericht nicht gefunden. Zuerst erstellen." },
      { status: 404 },
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
