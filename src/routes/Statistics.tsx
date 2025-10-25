import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Target, Trophy, Clock, Zap, Calendar } from 'lucide-react';
import { AnimatedCounter, StatCard } from '../components/AnimatedCounter';

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
    averageTimePerTask: 0,
    improvementTrend: 0,
    weeklyGoal: 0
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
          const totalAttempted = localSessions.reduce((sum: number, s: SessionSummary) => sum + (s.totals.attempted || 0), 0);
          const totalCorrect = localSessions.reduce((sum: number, s: SessionSummary) => sum + (s.totals.correct || 0), 0);
          const averageAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
          
          // Robust bestStreak calculation
          const validStreaks = localSessions
            .map((s: SessionSummary) => s.totals.maxStreak)
            .filter((streak: number) => typeof streak === 'number' && !isNaN(streak) && streak >= 0);
          const bestStreak = validStreaks.length > 0 ? Math.max(...validStreaks) : 0;
          
          const averageTimePerTask = localSessions.length > 0 
            ? localSessions.reduce((sum: number, s: SessionSummary) => sum + (s.totals.avgTimeMs || 0), 0) / localSessions.length 
            : 0;

          // Calculate improvement trend (compare last 3 sessions to previous 3)
          let improvementTrend = 0;
          if (localSessions.length >= 6) {
            const recent3 = localSessions.slice(0, 3);
            const previous3 = localSessions.slice(3, 6);
          const recentAvg = recent3.reduce((sum: number, s: SessionSummary) => sum + s.totals.accuracyPct, 0) / 3;
          const previousAvg = previous3.reduce((sum: number, s: SessionSummary) => sum + s.totals.accuracyPct, 0) / 3;
            improvementTrend = Math.round(recentAvg - previousAvg);
          }

          // Calculate weekly goal progress
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const weeklySessions = localSessions.filter((s: SessionSummary) => 
            new Date(s.startedAt) >= oneWeekAgo
          ).length;

          setStats({
            totalSessions,
            totalAttempted,
            totalCorrect,
            averageAccuracy,
            bestStreak,
            averageTimePerTask,
            improvementTrend,
            weeklyGoal: weeklySessions
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your statistics...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
            <p className="text-gray-600">Track your math practice progress</p>
          </div>
        </motion.div>
      
      {recentSessions.length > 0 ? (
        <>
            {/* Overall Performance Cards */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions}
                icon={<Calendar className="text-blue-500" size={20} />}
                color="text-blue-600"
                animated={true}
              />
              <StatCard
                title="Problems Solved"
                value={stats.totalCorrect}
                icon={<Target className="text-green-500" size={20} />}
                color="text-green-600"
                animated={true}
              />
              <StatCard
                title="Average Accuracy"
                value={stats.averageAccuracy}
                suffix="%"
                icon={<Zap className="text-purple-500" size={20} />}
                color="text-purple-600"
                animated={true}
              />
              <StatCard
                title="Best Streak"
                value={stats.bestStreak}
                icon={<Trophy className="text-yellow-500" size={20} />}
                color="text-yellow-600"
                animated={true}
              />
              <StatCard
                title="Avg Speed"
                value={stats.averageTimePerTask / 1000}
                suffix="s"
                icon={<Clock className="text-orange-500" size={20} />}
                color="text-orange-600"
                animated={true}
                decimals={2}
              />
            </motion.div>



            {/* Recent Sessions */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(session.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">LATEST</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.totals.correct}/{session.totals.attempted} ({session.totals.accuracyPct}%) — 
                          Avg: {(session.totals.avgTimeMs / 1000).toFixed(2)}s per task
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.totals.maxStreak > 0 && (
                          <div className="text-sm text-yellow-600 flex items-center gap-1">
                            🔥 {session.totals.maxStreak}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {session.settings.lengthSec}s
                        </div>
                      </div>
                    </div>
                  </motion.div>
              ))}
            </div>
            </motion.div>
        </>
      ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Statistics Yet</h3>
            <p className="text-gray-600 mb-8">Complete some practice sessions to see your statistics here.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Target size={20} />
            Start Practicing
          </Link>
          </motion.div>
      )}
      </div>
    </div>
  );
}
