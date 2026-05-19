import type { Metadata, Viewport } from "next";
import { StationStatus } from "@/components/StationStatus";
import { TerminalNav } from "@/components/TerminalNav";
import { loadLatestPointer } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "INDY 500 WEATHER PANIC CENTER",
  description:
    "Race week forecast watch for Indianapolis Motor Speedway.",
  applicationName: "Indy Weather Panic Center",
  appleWebApp: {
    capable: true,
    title: "Panic Center",
    statusBarStyle: "black",
  },
};

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
  const latest = await loadLatestPointer();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <TerminalNav />
          {children}
          <StationStatus
            lastSync={latest?.updatedAt ?? null}
            snapshotId={latest?.snapshotId ?? null}
          />
          <footer className="status-line site-footer">
            NOAA grid IND/55,70 — unofficial fan bunker — not affiliated with
            IMS/NWS
            <br />
            <a href="/archive">Atmospheric Incident Archive</a> — forthcoming
          </footer>
        </div>
      </body>
    </html>
  );
}
