import type { ChangelogEntry } from "@/lib/types";

interface ChangeFeedProps {
  entries: ChangelogEntry[];
  limit?: number;
}

export function ChangeFeed({ entries, limit = 20 }: ChangeFeedProps) {
  const visible = entries.slice(0, limit);

  return (
    <section className="panel">
      <h2 className="panel-title">Forecast Change Feed</h2>
      {visible.length === 0 ? (
        <p className="status-line">No atmospheric revisions logged.</p>
      ) : (
        visible.map((entry) => (
          <article key={`${entry.snapshotId}-${entry.at}`} className="feed-item">
            <div>
              <span className={`severity-${entry.severity}`}>
                [{entry.severity.toUpperCase()}]
              </span>{" "}
              <span className="feed-time">{entry.at}</span>
            </div>
            <p>{entry.summary}</p>
            {entry.details.length > 0 && (
              <ul>
                {entry.details.map((detail) => (
                  <li key={detail} className="status-line">
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))
      )}
    </section>
  );
}
