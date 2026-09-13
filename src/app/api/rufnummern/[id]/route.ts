import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if ("name" in body) update.name = body.name;
  if ("ban" in body) update.ban = body.ban;
  if ("erwarteter_betrag" in body) {
    update.erwarteter_betrag =
      body.erwarteter_betrag === "" || body.erwarteter_betrag === null
        ? null
        : Number(body.erwarteter_betrag);
  }
  if ("notiz" in body) update.notiz = body.notiz;
  if ("aktiv" in body) update.aktiv = Boolean(body.aktiv);
  update.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase.from("rufnummern").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("rufnummern").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
