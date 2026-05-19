import { NextResponse } from "next/server";
import { runPoll } from "./run-poll";

export function isPollWeatherAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  return false;
}

export async function handlePollWeatherGet(
  request: Request,
): Promise<NextResponse> {
  if (!isPollWeatherAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runPoll({ forceWindow: true });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
