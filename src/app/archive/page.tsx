import { AsciiHeader } from "@/components/AsciiHeader";
import Link from "next/link";

export const dynamic = "force-static";

export default function ArchivePage() {
  return (
    <>
      <AsciiHeader compact pageHint="Historic Indy 500 weather lore" />
      <section className="panel">
        <h2 className="panel-title">Atmospheric Incident Archive</h2>
        <p>Forthcoming.</p>
        <p className="status-line">
          This section will catalog historic Indy 500 delays, postponements,
          famous rain years, and track/weather lore.
        </p>
        <ul className="intro-list">
          <li>2007 — rain-shortened race</li>
          <li>1975 — postponed to following weekend</li>
          <li>1967 — 18-inch rainfall lore around race month</li>
        </ul>
        <p>
          <Link href="/">Return to dashboard</Link>
        </p>
      </section>
    </>
  );
}
