import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Settings, Play, Target, Trophy, Clock } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { loadSessions, saveSettings } from '../lib/storage';
import type { SessionLength } from '../lib/types';

export default function Start() {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCorrect: 0,
    bestStreak: 0,
    todaySessions: 0
  });

  useEffect(() => {
    const sessions = loadSessions();
    const today = new Date().toDateString();
    setStats({
      totalSessions: sessions.length,
      totalCorrect: sessions.reduce((sum, s) => sum + (s.totals.correct || 0), 0),
      bestStreak: Math.max(0, ...sessions.map(s => s.totals.maxStreak || 0)),
      todaySessions: sessions.filter(s => new Date(s.startedAt).toDateString() === today).length,
    });
  }, []);

  const start = async () => {
    await playSound('click');
    navigate('/practice');
  };

  const quickStart = async (duration: SessionLength) => {
    saveSettings({ lengthSec: duration });
    await playSound('click');
    setTimeout(() => start(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Math Practice</h1>
            <p className="text-gray-600">Master arithmetic with timed practice sessions</p>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/statistics" 
              className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
              title="Statistics"
            >
              <BarChart3 size={20} />
            </Link>
            <Link 
              to="/settings" 
              className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
              title="Settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        {stats.totalSessions > 0 && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Sessions</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={stats.totalSessions} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-green-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Correct</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={stats.totalCorrect} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">🔥</span>
                <span className="text-sm font-medium text-gray-600">Best Streak</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={stats.bestStreak} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-gray-600">Today</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={stats.todaySessions} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Action */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Practice?</h2>
            <p className="text-gray-600 mb-6">Choose your session length and start improving your math skills!</p>
            
            <motion.button
              onClick={start}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="inline mr-2" size={24} />
              Start Practice
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Start Options */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            onClick={() => quickStart(30)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600" size={20} />
              </div>
              <span className="font-semibold text-gray-900">Quick Practice</span>
            </div>
            <p className="text-sm text-gray-600">30 seconds</p>
          </motion.button>

          <motion.button
            onClick={() => quickStart(60)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group border-green-200 bg-green-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="text-green-600" size={20} />
              </div>
              <span className="font-semibold text-gray-900">Standard Practice</span>
            </div>
            <p className="text-sm text-gray-600">60 seconds (Recommended)</p>
          </motion.button>

          <motion.button
            onClick={() => quickStart(120)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="text-purple-600" size={20} />
              </div>
              <span className="font-semibold text-gray-900">Extended Practice</span>
            </div>
            <p className="text-sm text-gray-600">120 seconds</p>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}


