import { NextResponse } from "next/server";
import { loadStationMeta } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Live station meta for client refresh (reads Blob in production). */
export async function GET() {
  const station = await loadStationMeta();
  return NextResponse.json(station, {
    headers: { "Cache-Control": "no-store" },
  });
}
