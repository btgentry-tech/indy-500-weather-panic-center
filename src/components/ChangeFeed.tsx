import type { ChangelogEntry } from "@/lib/types";
import { formatFeedDayKey, formatFeedTime } from "@/lib/format";

interface ChangeFeedProps {
  entries: ChangelogEntry[];
  limit?: number;
}

function hasPanicIndexChange(entry: ChangelogEntry): boolean {
  return (
    entry.panicIndexFrom !== undefined ||
    entry.panicIndexTo !== undefined ||
    entry.summary.toLowerCase().includes("panic index")
  );
}

export function ChangeFeed({ entries, limit = 20 }: ChangeFeedProps) {
  const visible = entries.slice(0, limit);

  let lastDayKey = "";

  return (
    <section className="panel">
      <h2 className="panel-title">What Changed?</h2>
      {visible.length === 0 ? (
        <p className="status-line">No atmospheric revisions logged.</p>
      ) : (
        visible.map((entry) => {
          const dayKey = formatFeedDayKey(entry.at);
          const showDivider = dayKey !== lastDayKey;
          lastDayKey = dayKey;

          return (
            <div key={`${entry.snapshotId}-${entry.at}`}>
              {showDivider && (
                <p className="feed-day-divider">--- {dayKey} ---</p>
              )}
              <article
                className={`feed-item ${hasPanicIndexChange(entry) ? "feed-item-panic" : ""}`}
              >
                <div className="feed-header">
                  <span className={`severity-${entry.severity}`}>
                    [{entry.severity.toUpperCase()}]
                  </span>
                  <span className="feed-time" title={entry.at}>
                    {formatFeedTime(entry.at)}
                  </span>
                  <span className="feed-id">{entry.snapshotId}</span>
                </div>
                <p className="feed-summary">{entry.summary}</p>
                {entry.details.length > 0 && (
                  <ul className="feed-details">
                    {entry.details.map((detail) => (
                      <li key={detail}>› {detail}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          );
        })
      )}
    </section>
  );
}
