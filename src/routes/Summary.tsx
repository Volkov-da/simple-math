import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  settings: {
    skills: string[];
    difficulty: string;
    lengthSec: 30 | 60 | 120;
    seed: string;
  };
  totals: {
    attempted: number;
    correct: number;
    accuracyPct: number;
    avgTimeMs: number;
    maxStreak: number;
    finalStreak: number;
  };
  perSkill: any;
}

export default function Summary() {
  const { sessionId } = useParams();
  const [summary, setSummary] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        // Load current session summary
        const summaryRaw = typeof window !== 'undefined' ? localStorage.getItem('lastSummary') : null;
        const localSummary = summaryRaw ? JSON.parse(summaryRaw) : null;
        setSummary(localSummary);

        // Load recent sessions from localStorage
        const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
        setRecentSessions(localSessions);
      } catch (error) {
        console.error('Error loading summary data:', error);
        setRecentSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Session Summary</h1>
      {summary ? (
        <div style={{ marginTop: 16 }}>
          <div>Attempted: <strong>{summary.totals.attempted}</strong></div>
          <div>Correct: <strong>{summary.totals.correct}</strong></div>
          <div>Accuracy: <strong>{summary.totals.accuracyPct}%</strong></div>
          <div>Avg time/item: <strong>{summary.totals.avgTimeMs} ms</strong></div>
          {summary.totals.maxStreak > 0 && (
            <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
              <div style={{ color: '#0369a1', fontWeight: 'bold', marginBottom: '4px' }}>🔥 Streak Stats</div>
              <div>Best streak: <strong>{summary.totals.maxStreak}</strong></div>
              {summary.totals.finalStreak > 0 && (
                <div>Ended with: <strong>{summary.totals.finalStreak}</strong> in a row</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p>No summary found for {sessionId}</p>
      )}
      <div style={{ marginTop: 24 }}>
        <h3>Recent sessions</h3>
        <ul>
          {recentSessions.map((s) => (
            <li key={s.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div>{new Date(s.startedAt).toLocaleTimeString()} — {s.totals.correct}/{s.totals.attempted} ({s.totals.accuracyPct}%)</div>
              {s.totals.maxStreak > 0 && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                  🔥 Best streak: {s.totals.maxStreak}
                </div>
              )}
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


