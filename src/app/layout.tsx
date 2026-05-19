import type { Metadata, Viewport } from "next";
import { LiveConditionsStrip } from "@/components/LiveConditionsStrip";
import { StationStatus } from "@/components/StationStatus";
import { TerminalNav } from "@/components/TerminalNav";
import { loadStationMeta } from "@/lib/data";
import { fetchLocalConditionsSafe } from "@/lib/noaa";
import "./globals.css";

export const metadata: Metadata = {
  title: "INDY 500 WEATHER PANIC CENTER",
  description:
    "Race week forecast watch for Indianapolis Motor Speedway.",
  applicationName: "Indy 500 Weather",
  appleWebApp: {
    capable: true,
    title: "Indy 500 Weather",
    statusBarStyle: "black",
  },
};

/** Revalidate every 15 minutes so committed poll data appears without a full redeploy. */
export const revalidate = 900;

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const station = await loadStationMeta();
  const localConditions =
    station.localConditions ?? (await fetchLocalConditionsSafe(900));

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <TerminalNav />
          {children}
          <LiveConditionsStrip conditions={localConditions} />
          <StationStatus station={station} />
          <footer className="status-line site-footer">
            NOAA grid IND/55,70 — unofficial fan bunker — not affiliated with
            IMS/NWS
            <br />
            <a href="/archive">Atmospheric Incident Archive</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
