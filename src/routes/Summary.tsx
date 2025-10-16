import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Clock, Zap, TrendingUp, Star, Award } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { getPerformanceRating, getSkillFeedback } from '../utils/encouragement';
import { AnimatedCounter, StatCard, ProgressBar } from '../components/AnimatedCounter';
import { CircularProgress } from '../components/ProgressRing';
import { fadeIn, slideUp, scaleIn, bounceIn } from '../utils/animations';

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
  const { playSound } = useSound();
  const [summary, setSummary] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current session summary
        const summaryRaw = typeof window !== 'undefined' ? localStorage.getItem('lastSummary') : null;
        const localSummary = summaryRaw ? JSON.parse(summaryRaw) : null;
        setSummary(localSummary);

        // Load recent sessions from localStorage
        const localSessions = JSON.parse(localStorage.getItem('summaries') || '[]');
        setRecentSessions(localSessions);

        // Play victory sound and show celebration for good performance
        if (localSummary && localSummary.totals.accuracyPct >= 80) {
          await playSound('victory');
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } catch (error) {
        console.error('Error loading summary data:', error);
        setRecentSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [playSound]);

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
          <div className="text-gray-600">Loading your results...</div>
        </motion.div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600 mb-8">No summary found for this session.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
            >
              <ArrowLeft size={20} />
              Back to Start
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const performanceRating = getPerformanceRating(summary.totals.accuracyPct, summary.totals.avgTimeMs);
  const isPersonalBest = recentSessions.length > 1 && 
    summary.totals.accuracyPct > Math.max(...recentSessions.slice(1).map(s => s.totals.accuracyPct));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>
            <p className="text-gray-600">{new Date(summary.startedAt).toLocaleDateString()}</p>
          </div>
        </motion.div>

        {/* Performance Rating */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <motion.div
              className="text-6xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
            >
              {performanceRating.emoji}
            </motion.div>
            <h2 className={`text-3xl font-bold ${performanceRating.color} mb-2`}>
              {performanceRating.rating}
            </h2>
            <p className="text-gray-600">Great job on this session!</p>
            {isPersonalBest && (
              <motion.div
                className="mt-4 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Award size={16} />
                Personal Best!
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Main Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatCard
            title="Attempted"
            value={summary.totals.attempted}
            icon={<Target className="text-blue-500" size={20} />}
            color="text-blue-600"
            animated={true}
          />
          <StatCard
            title="Correct"
            value={summary.totals.correct}
            icon={<Trophy className="text-green-500" size={20} />}
            color="text-green-600"
            animated={true}
          />
          <StatCard
            title="Accuracy"
            value={summary.totals.accuracyPct}
            suffix="%"
            icon={<Zap className="text-purple-500" size={20} />}
            color="text-purple-600"
            animated={true}
          />
          <StatCard
            title="Avg Time"
            value={Math.round(summary.totals.avgTimeMs / 1000 * 10) / 10}
            suffix="s"
            icon={<Clock className="text-orange-500" size={20} />}
            color="text-orange-600"
            animated={true}
          />
        </motion.div>

        {/* Accuracy Visualization */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
          <div className="flex items-center gap-6">
            <CircularProgress
              value={summary.totals.accuracyPct}
              max={100}
              size={120}
              color="#22c55e"
              showPercentage={true}
            />
            <div className="flex-1">
              <ProgressBar
                value={summary.totals.correct}
                max={summary.totals.attempted}
                label="Correct Answers"
                color="bg-green-500"
                animated={true}
              />
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Speed</span>
                  <span>{Math.round(summary.totals.avgTimeMs / 1000 * 10) / 10}s per problem</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (5000 - summary.totals.avgTimeMs) / 50)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Streak Stats */}
          {summary.totals.maxStreak > 0 && (
          <motion.div 
            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔥</span>
              <h3 className="text-lg font-semibold text-gray-900">Streak Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Best Streak</div>
                <div className="text-2xl font-bold text-yellow-600">
                  <AnimatedCounter value={summary.totals.maxStreak} />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Final Streak</div>
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter value={summary.totals.finalStreak} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Sessions */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session, index) => (
              <motion.div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(session.startedAt).toLocaleDateString()} — {new Date(session.startedAt).toLocaleTimeString()}
                      {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">LATEST</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {session.totals.correct}/{session.totals.attempted} ({session.totals.accuracyPct}%) — 
                      Avg: {(session.totals.avgTimeMs / 1000).toFixed(1)}s per task
                    </div>
                  </div>
                  {session.totals.maxStreak > 0 && (
                    <div className="text-sm text-yellow-600">
                      🔥 {session.totals.maxStreak}
        </div>
                  )}
                </div>
              </motion.div>
          ))}
      </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link
            to="/"
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Trophy size={20} />
          Play Again
        </Link>
          <Link
            to="/statistics"
            className="px-6 py-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            <TrendingUp size={20} />
          View Statistics
        </Link>
        </motion.div>

        {/* Celebration Effect */}
        {showCelebration && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-6xl"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 0.6,
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


