import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKFLOW_FILE = "poll-weather.yml";

/**
 * Vercel Cron backup: triggers the GitHub Actions Poll Weather workflow.
 * Set CRON_SECRET and GITHUB_PAT (repo scope: actions:write) on Vercel.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER ?? "btgentry-tech";
  const repo = process.env.GITHUB_REPO_NAME ?? "indy-500-weather-panic-center";

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_PAT not configured on Vercel" },
      { status: 503 },
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: "GitHub workflow dispatch failed", detail: body },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, triggered: WORKFLOW_FILE });
}
