import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "INDY 500 WEATHER PANIC CENTER",
  description:
    "Atmospheric monitoring for Indianapolis Motor Speedway race weekend.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <nav className="nav" aria-label="Main">
            <Link href="/">Dashboard</Link>
            <Link href="/history">History</Link>
            <Link href="/timeline">Timeline</Link>
          </nav>
          {children}
          <footer className="status-line" style={{ marginTop: 24 }}>
            NOAA grid IND/55,70 — unofficial fan bunker — not affiliated with
            IMS/NWS
          </footer>
        </div>
      </body>
    </html>
  );
}
