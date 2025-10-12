import { Link } from 'react-router-dom';
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

export default function Statistics() {
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    averageAccuracy: 0,
    bestStreak: 0,
    averageTimePerTask: 0
  });

  useEffect(() => {
    const loadData = () => {
      try {
        // Load recent sessions from localStorage
        const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
        setRecentSessions(localSessions);

        // Calculate overall statistics
        if (localSessions.length > 0) {
          const totalSessions = localSessions.length;
          const totalAttempted = localSessions.reduce((sum: number, s: SessionSummary) => sum + s.totals.attempted, 0);
          const totalCorrect = localSessions.reduce((sum: number, s: SessionSummary) => sum + s.totals.correct, 0);
          const averageAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
          const bestStreak = Math.max(...localSessions.map((s: SessionSummary) => s.totals.maxStreak));
          const averageTimePerTask = totalAttempted > 0 
            ? Math.round(localSessions.reduce((sum: number, s: SessionSummary) => sum + (s.totals.avgTimeMs * s.totals.attempted), 0) / totalAttempted) 
            : 0;

          setStats({
            totalSessions,
            totalAttempted,
            totalCorrect,
            averageAccuracy,
            bestStreak,
            averageTimePerTask
          });
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
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
        <div>Loading statistics...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Statistics</h1>
      
      {recentSessions.length > 0 ? (
        <>
          {/* Overall Statistics */}
          <div style={{ marginTop: 24, padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ marginTop: 0, color: '#495057' }}>Overall Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.totalSessions}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalAttempted}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Attempted</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.totalCorrect}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Correct</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.averageAccuracy}%</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Average Accuracy</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>🔥 {stats.bestStreak}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Best Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{(stats.averageTimePerTask / 1000).toFixed(1)}s</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Time/Task</div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div style={{ marginTop: 24 }}>
            <h3>Recent Sessions</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentSessions.map((s, index) => (
                <div key={s.id} style={{ 
                  marginBottom: '12px', 
                  padding: '12px', 
                  backgroundColor: index === 0 ? '#f0f9ff' : '#f8f9fa', 
                  borderRadius: '6px',
                  border: index === 0 ? '2px solid #3b82f6' : '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div>
                      <strong>{new Date(s.startedAt).toLocaleDateString()}</strong> — {new Date(s.startedAt).toLocaleTimeString()}
                      {index === 0 && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>LATEST</span>}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {s.settings.lengthSec}s session
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{s.totals.correct}/{s.totals.attempted}</span> ({s.totals.accuracyPct}%) — 
                      Avg: <strong>{(s.totals.avgTimeMs / 1000).toFixed(1)}s</strong> per task
                    </div>
                    {s.totals.maxStreak > 0 && (
                      <div style={{ fontSize: '14px', color: '#f59e0b' }}>
                        🔥 Best: {s.totals.maxStreak}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3>No Statistics Yet</h3>
          <p>Complete some practice sessions to see your statistics here.</p>
          <Link to="/" style={{ 
            display: 'inline-block', 
            marginTop: '16px', 
            padding: '12px 24px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '6px' 
          }}>
            Start Practicing
          </Link>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to Start</Link>
      </div>
    </div>
  );
}
