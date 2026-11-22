import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle, Target, Clock, Zap } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { getEncouragementMessage } from '../utils/encouragement';
import { ConfettiBurst } from '../components/Confetti';
import { TimerRing } from '../components/ProgressRing';
import { shake, streakGlow } from '../utils/animations';
import { enabledSkills, generateItem, isCorrectAnswer } from '../lib/problems';
import { loadSettings, saveSession } from '../lib/storage';
import type { Item, SessionSummary, SkillTotals } from '../lib/types';

type Stats = {
  attempted: number;
  correct: number;
  sumTimeMs: number;
  currentStreak: number;
  maxStreak: number;
  perSkill: SessionSummary['perSkill'];
};

const EMPTY_STATS: Stats = { attempted: 0, correct: 0, sumTimeMs: 0, currentStreak: 0, maxStreak: 0, perSkill: {} };
const TICK_MS = 200;

export default function Practice() {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const [settings] = useState(loadSettings);
  const { lengthSec, ops, digits } = settings;

  const [timeLeft, setTimeLeft] = useState<number>(lengthSec);
  const [currentItem, setCurrentItem] = useState<Item>(() => generateItem(ops, digits));
  const [answer, setAnswer] = useState('');
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [flash, setFlash] = useState<'correct' | 'incorrect' | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Time is tracked with timestamps rather than by counting ticks, so the clock can't drift
  // or stall. Pausing pushes the deadline (and the current problem's start time) forward.
  const [startedAt] = useState(() => Date.now());
  const deadlineRef = useRef(startedAt + lengthSec * 1000);
  const pausedAtRef = useRef<number | null>(null);
  const lastSubmitAt = useRef(startedAt);
  const statsRef = useRef<Stats>(EMPTY_STATS);
  const endedRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const endSession = useCallback(
    (reason: 'timeout' | 'exit') => {
      if (endedRef.current) return;
      endedRef.current = true;
      const s = statsRef.current;
      const summary: SessionSummary = {
        id: crypto.randomUUID(),
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        settings: { skills: enabledSkills(settings.ops), lengthSec: settings.lengthSec, digits: settings.digits },
        endReason: reason,
        totals: {
          attempted: s.attempted,
          correct: s.correct,
          accuracyPct: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
          avgTimeMs: s.attempted > 0 ? s.sumTimeMs / s.attempted : 0,
          maxStreak: s.maxStreak,
          finalStreak: s.currentStreak,
        },
        perSkill: s.perSkill,
      };
      saveSession(summary);
      navigate(`/summary/${summary.id}`);
    },
    [navigate, settings, startedAt],
  );

  useEffect(() => {
    if (isPaused) return;
    inputRef.current?.focus();
    const tick = () => {
      const remainingMs = deadlineRef.current - Date.now();
      setTimeLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
      if (remainingMs <= 0) endSession('timeout');
    };
    tick();
    const iv = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(iv);
  }, [isPaused, endSession]);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current != null) window.clearTimeout(feedbackTimeoutRef.current);
    },
    [],
  );

  const togglePause = () => {
    const now = Date.now();
    if (isPaused) {
      const pausedFor = now - (pausedAtRef.current ?? now);
      deadlineRef.current += pausedFor;
      lastSubmitAt.current += pausedFor;
      pausedAtRef.current = null;
    } else {
      pausedAtRef.current = now;
    }
    setIsPaused(!isPaused);
    void playSound('click');
  };

  function submit(e?: FormEvent) {
    e?.preventDefault();
    // Ignore empty submissions so a stray Enter doesn't count as a wrong answer.
    if (isPaused || endedRef.current || answer.trim() === '') return;

    const now = Date.now();
    const elapsed = now - lastSubmitAt.current;
    lastSubmitAt.current = now;
    const isCorrect = isCorrectAnswer(answer, currentItem.correctAnswer);

    const prev = statsRef.current;
    const prevSkill: SkillTotals = prev.perSkill[currentItem.skill] ?? { attempted: 0, correct: 0, totalTimeMs: 0 };
    const streak = isCorrect ? prev.currentStreak + 1 : 0;
    const next: Stats = {
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      sumTimeMs: prev.sumTimeMs + elapsed,
      currentStreak: streak,
      maxStreak: Math.max(prev.maxStreak, streak),
      perSkill: {
        ...prev.perSkill,
        [currentItem.skill]: {
          attempted: prevSkill.attempted + 1,
          correct: prevSkill.correct + (isCorrect ? 1 : 0),
          totalTimeMs: prevSkill.totalTimeMs + elapsed,
        },
      },
    };
    statsRef.current = next;
    setStats(next);

    const prevAccuracy = prev.attempted > 0 ? (prev.correct / prev.attempted) * 100 : 0;
    if (isCorrect) {
      void playSound('correct');
      if (streak === 3 || streak === 5 || streak % 10 === 0) {
        setShowConfetti(n => n + 1);
        void playSound('streak');
      }
      setEncouragementMessage(
        getEncouragementMessage('correct', {
          streak,
          accuracy: prevAccuracy,
          isFirstCorrect: next.correct === 1,
          isPersonalBest: streak > prev.maxStreak,
        }),
      );
    } else {
      void playSound('incorrect');
      setEncouragementMessage(getEncouragementMessage('incorrect', { streak: prev.currentStreak, accuracy: prevAccuracy }));
    }

    setLastCorrectAnswer(currentItem.correctAnswer);
    setFlash(isCorrect ? 'correct' : 'incorrect');
    setAnswer('');
    setCurrentItem(generateItem(ops, digits));
    inputRef.current?.focus();

    // Restart the feedback timer so an earlier answer's timeout can't clear newer feedback.
    if (feedbackTimeoutRef.current != null) window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(
      () => {
        setFlash(null);
        setEncouragementMessage('');
      },
      isCorrect ? 1500 : 2000,
    );
  }

  const { attempted, correct: correctCount, sumTimeMs, currentStreak } = stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Timer and Controls */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <TimerRing 
              timeLeft={timeLeft} 
              totalTime={lengthSec} 
              size={80}
              className={isPaused ? 'opacity-50' : ''}
            />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {isPaused ? 'Paused' : 'Time Remaining'}
              </div>
              <div className="text-sm text-gray-500">Practice Session</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={togglePause}
              className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <button
              onClick={() => endSession('exit')}
              className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <CheckCircle size={20} />
            </button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="text-blue-500" size={16} />
              <span className="text-sm font-medium text-gray-600">Score</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {correctCount}/{attempted}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-500">🔥</span>
              <span className="text-sm font-medium text-gray-600">Streak</span>
            </div>
            <motion.div 
              className="text-xl font-bold text-gray-900"
              animate={currentStreak > 0 ? streakGlow : {}}
            >
              {currentStreak}
            </motion.div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="text-green-500" size={16} />
              <span className="text-sm font-medium text-gray-600">Accuracy</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0}%
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="text-purple-500" size={16} />
              <span className="text-sm font-medium text-gray-600">Avg Time</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {attempted > 0 ? (sumTimeMs / attempted / 1000).toFixed(2) : '0.00'}s
            </div>
          </div>
        </motion.div>

        {/* Main Practice Area */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
              flash === 'correct' 
                ? 'border-green-200 bg-green-50' 
                : flash === 'incorrect' 
                ? 'border-red-200 bg-red-50' 
                : 'border-gray-200'
            }`}
            animate={flash === 'incorrect' ? shake : {}}
          >
            {/* Problem Display */}
            <motion.div 
              className="text-6xl font-bold text-gray-900 mb-8"
              key={currentItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentItem.promptText}
            </motion.div>

            {/* Answer Input and Submit Button Container */}
            <form onSubmit={submit} className="flex flex-col items-center space-y-6">
              {/* Answer Input */}
              <motion.input
                ref={inputRef}
                value={answer}
                onChange={e => setAnswer(e.target.value.replace(/[^0-9.-]/g, ''))}
                inputMode="decimal"
                className="text-4xl font-mono text-center w-80 py-4 px-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="?"
                autoFocus
                disabled={isPaused}
              />

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isPaused}
              >
                Submit (Enter)
              </motion.button>
            </form>

          </motion.div>
        </motion.div>

        {/* Fixed Feedback Messages */}
        <div className="mt-8 min-h-[120px] flex flex-col items-center justify-center">
          <AnimatePresence>
            {flash && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className={`text-3xl font-bold mb-2 ${
                  flash === 'correct' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {flash === 'correct' ? 'Correct!' : `Incorrect. Answer: ${lastCorrectAnswer}`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {encouragementMessage && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="text-xl font-medium text-gray-700 max-w-md">
                  {encouragementMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confetti Effect */}
        <ConfettiBurst trigger={showConfetti} />
      </div>
    </div>
  );
}


