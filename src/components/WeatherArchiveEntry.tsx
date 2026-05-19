import type { NotableWeatherEvent } from "@/lib/notable-weather-events";

interface WeatherArchiveEntryProps {
  event: NotableWeatherEvent;
}

export function WeatherArchiveEntry({ event }: WeatherArchiveEntryProps) {
  return (
    <article
      className={`weather-archive-entry weather-archive-${event.severity}`}
    >
      <header className="weather-archive-header">
        <h3 className="weather-archive-year">{event.year}</h3>
        <span className="weather-archive-tag">[{event.tag}]</span>
      </header>
      <p className="weather-archive-summary">{event.summary}</p>
      <dl className="weather-archive-meta">
        <div className="weather-archive-meta-row">
          <dt>Winner</dt>
          <dd>{event.winner}</dd>
        </div>
        <div className="weather-archive-meta-row">
          <dt>Official distance</dt>
          <dd>{event.officialDistance}</dd>
        </div>
        <div className="weather-archive-meta-row">
          <dt>Status</dt>
          <dd>{event.status}</dd>
        </div>
      </dl>
      <p className="weather-archive-narrative">{event.narrative}</p>
    </article>
  );
}
