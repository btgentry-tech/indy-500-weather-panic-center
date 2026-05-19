import { AsciiHeader } from "@/components/AsciiHeader";
import { WeatherArchiveEntry } from "@/components/WeatherArchiveEntry";
import { NOTABLE_WEATHER_EVENTS } from "@/lib/notable-weather-events";
import Link from "next/link";

export const revalidate = 900;

export default function ArchivePage() {
  return (
    <>
      <AsciiHeader compact pageHint="Historical Indianapolis 500 weather log" />
      <section className="panel weather-archive-panel">
        <header className="weather-archive-intro">
          <h2 className="weather-archive-title">NOTABLE WEATHER EVENTS</h2>
          <p className="weather-archive-subtitle">
            Major weather disruptions, delays, and atmospheric incidents in
            Indianapolis 500 history.
          </p>
          <p className="weather-archive-disclaimer">
            Unofficial fan reference — verify against official IMS historical
            records.
          </p>
        </header>
        <div className="weather-archive-log">
          {NOTABLE_WEATHER_EVENTS.map((event) => (
            <WeatherArchiveEntry key={event.year} event={event} />
          ))}
        </div>
        <p className="status-line weather-archive-footer">
          <Link href="/">Return to dashboard</Link>
        </p>
      </section>
    </>
  );
}
