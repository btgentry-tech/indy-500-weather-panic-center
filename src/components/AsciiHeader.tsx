export function AsciiHeader() {
  const art = `╔══════════════════════════════════════════════════════╗
║   INDY 500 WEATHER PANIC CENTER                      ║
║   ATMOSPHERIC MONITORING DIVISION                    ║
╚══════════════════════════════════════════════════════╝`;

  return (
    <header className="panel">
      <pre className="ascii-title" aria-label="Indy 500 Weather Panic Center">
        {art}
      </pre>
      <p className="subtitle">
        Indianapolis Motor Speedway sector — unauthorized optimism discouraged.
      </p>
    </header>
  );
}
