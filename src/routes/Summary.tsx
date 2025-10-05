import { Link, useParams } from 'react-router-dom';

export default function Summary() {
  const { sessionId } = useParams();
  const summaryRaw = typeof window !== 'undefined' ? localStorage.getItem('lastSummary') : null;
  const summary = summaryRaw ? JSON.parse(summaryRaw) : null;
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Session Summary</h1>
      {summary ? (
        <div style={{ marginTop: 16 }}>
          <div>Attempted: <strong>{summary.totals.attempted}</strong></div>
          <div>Correct: <strong>{summary.totals.correct}</strong></div>
          <div>Accuracy: <strong>{summary.totals.accuracyPct}%</strong></div>
          <div>Avg time/item: <strong>{summary.totals.avgTimeMs} ms</strong></div>
        </div>
      ) : (
        <p>No summary found for {sessionId}</p>
      )}
      <div style={{ marginTop: 24 }}>
        <h3>Recent sessions</h3>
        <ul>
          {(JSON.parse(localStorage.getItem('summaries') || '[]') as any[]).map((s) => (
            <li key={s.id}>
              {new Date(s.startedAt).toLocaleTimeString()} — {s.totals.correct}/{s.totals.attempted} ({s.totals.accuracyPct}%)
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24 }}>
        <Link to="/">Play again</Link>
      </div>
    </div>
  );
}


