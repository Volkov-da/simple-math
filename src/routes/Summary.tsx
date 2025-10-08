import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataSyncService, SessionSummary } from '../services/dataSync';

export default function Summary() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current session summary
        const summaryRaw = typeof window !== 'undefined' ? localStorage.getItem('lastSummary') : null;
        const localSummary = summaryRaw ? JSON.parse(summaryRaw) : null;
        setSummary(localSummary);

        // Load recent sessions
        if (user) {
          // If user is logged in, try to load from Firestore
          const dataSync = DataSyncService.getInstance();
          const firestoreSessions = await dataSync.getUserSessions(user, 10);
          if (firestoreSessions.length > 0) {
            setRecentSessions(firestoreSessions);
          } else {
            // Fallback to localStorage
            const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
            setRecentSessions(localSessions);
          }
        } else {
          // Not logged in, use localStorage
          const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
          setRecentSessions(localSessions);
        }
      } catch (error) {
        console.error('Error loading summary data:', error);
        // Fallback to localStorage
        const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
        setRecentSessions(localSessions);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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
        </div>
      ) : (
        <p>No summary found for {sessionId}</p>
      )}
      <div style={{ marginTop: 24 }}>
        <h3>Recent sessions</h3>
        <ul>
          {recentSessions.map((s) => (
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


