interface AsciiHeaderProps {
  compact?: boolean;
  pageHint?: string;
}

export function AsciiHeader({ compact = false, pageHint }: AsciiHeaderProps) {
  if (compact) {
    return (
      <header className="site-header-compact">
        <h1 className="site-title">INDY 500 WEATHER PANIC CENTER</h1>
        <p className="subtitle">
          Indianapolis Motor Speedway — race week forecast watch
        </p>
        {pageHint && <p className="status-line">{pageHint}</p>}
      </header>
    );
  }

  const art = `╔══════════════════════════════════════╗
║  INDY 500 WEATHER PANIC CENTER       ║
╚══════════════════════════════════════╝`;

  return (
    <header className="site-header">
      <pre className="ascii-title" aria-label="Indy 500 Weather Panic Center">
        {art}
      </pre>
      <p className="subtitle">
        Indianapolis Motor Speedway — race week forecast watch
      </p>
      {pageHint && <p className="status-line">{pageHint}</p>}
    </header>
  );
}
