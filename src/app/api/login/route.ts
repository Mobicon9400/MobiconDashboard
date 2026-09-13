import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const { password } = await request.json();
  const expectedHash = process.env.APP_PASSWORD_HASH ?? "";
  const submittedHash = sha256(String(password ?? ""));

  const matches =
    expectedHash.length === submittedHash.length &&
    timingSafeEqual(Buffer.from(submittedHash), Buffer.from(expectedHash));

  if (!matches) {
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("mobicon_auth", expectedHash, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
