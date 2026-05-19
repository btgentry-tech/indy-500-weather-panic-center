/**
 * Primary serverless target for Vercel Cron.
 * /api/internal/poll-weather rewrites here (see vercel.json) when the
 * internal path is blocked at the edge.
 */
import { handlePollWeatherGet } from "@/lib/poll-weather-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return handlePollWeatherGet(request);
}
