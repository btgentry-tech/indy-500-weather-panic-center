import { NextResponse } from "next/server";
import { unsubscribeTokenFromTopic } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return NextResponse.json({ error: "Missing FCM token." }, { status: 400 });
    }

    await unsubscribeTokenFromTopic(body.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unsubscribe failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
