import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle, Target, Clock, Zap } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { getEncouragementMessage } from '../utils/encouragement';
import { ConfettiBurst } from '../components/Confetti';
import { TimerRing } from '../components/ProgressRing';
import { shake, streakGlow } from '../utils/animations';

type Skill = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'percent';

type Difficulty = 'easy' | 'medium';

type Item = {
  id: string;
  skill: Skill;
  operator: '+' | '-' | '*' | '/' | '%';
  operands: number[];
  correctAnswer: string;
  promptText: string;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// Helper functions to check for trivial cases
function isTrivialAddition(a: number, b: number): boolean {
  return a === 0 || b === 0 || a === 1 || b === 1;
}

function isTrivialSubtraction(a: number, b: number): boolean {
  return b === 0 || a === 0 || (a - b) === 1;
}

function isTrivialMultiplication(a: number, b: number): boolean {
  return a === 0 || b === 0 || a === 1 || b === 1;
}

function isTrivialDivision(a: number, b: number): boolean {
  return b === 1 || a === 0 || a === b || (a % b !== 0 && a < b);
}

function isTrivialPercent(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === 100 || y === 1;
}

function generateEasyItem(): Item {
  const savedOpsRaw = localStorage.getItem('ops');
  const enabled = savedOpsRaw ? (JSON.parse(savedOpsRaw) as Record<string, boolean>) : {
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    percent: true,
  };
  const savedDigitsRaw = localStorage.getItem('digits');
  let digits: Record<string, { first: { min: number; max: number }; second: { min: number; max: number } }>;
  
  if (savedDigitsRaw) {
    const parsed = JSON.parse(savedDigitsRaw);
    // Handle migration from old format to new format
    if (parsed.addition && typeof parsed.addition === 'number') {
      // Old format (single number) - convert to new format
      digits = {
        addition: { first: { min: parsed.addition, max: parsed.addition }, second: { min: parsed.addition, max: parsed.addition } },
        subtraction: { first: { min: parsed.subtraction, max: parsed.subtraction }, second: { min: parsed.subtraction, max: parsed.subtraction } },
        multiplication: { first: { min: parsed.multiplication, max: parsed.multiplication }, second: { min: parsed.multiplication, max: parsed.multiplication } },
        division: { first: { min: parsed.division, max: parsed.division }, second: { min: parsed.division, max: parsed.division } },
        percent: { first: { min: parsed.percent, max: parsed.percent }, second: { min: parsed.percent, max: parsed.percent } },
      };
    } else if (parsed.addition && typeof parsed.addition === 'object' && 'first' in parsed.addition && typeof parsed.addition.first === 'number') {
      // Previous format (first/second numbers) - convert to range format
      digits = {
        addition: { first: { min: parsed.addition.first, max: parsed.addition.first }, second: { min: parsed.addition.second, max: parsed.addition.second } },
        subtraction: { first: { min: parsed.subtraction.first, max: parsed.subtraction.first }, second: { min: parsed.subtraction.second, max: parsed.subtraction.second } },
        multiplication: { first: { min: parsed.multiplication.first, max: parsed.multiplication.first }, second: { min: parsed.multiplication.second, max: parsed.multiplication.second } },
        division: { first: { min: parsed.division.first, max: parsed.division.first }, second: { min: parsed.division.second, max: parsed.division.second } },
        percent: { first: { min: parsed.percent.first, max: parsed.percent.first }, second: { min: parsed.percent.second, max: parsed.percent.second } },
      };
    } else {
      digits = parsed;
    }
  } else {
    digits = {
      addition: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
      subtraction: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
      multiplication: { first: { min: 1, max: 1 }, second: { min: 1, max: 1 } },
      division: { first: { min: 1, max: 1 }, second: { min: 1, max: 1 } },
      percent: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
    };
  }
  const pool: Skill[] = (['addition','subtraction','multiplication','division','percent'] as Skill[]).filter(s => enabled[s]);
  const skillIndex = randInt(0, Math.max(0, pool.length - 1));
  const skill: Skill = pool[skillIndex] ?? 'addition';
  // Helper function to get random digit count within range
  const getRandomDigits = (range: { min: number; max: number }) => {
    const min = Math.max(1, Math.min(4, range.min));
    const max = Math.max(1, Math.min(4, range.max));
    return randInt(min, max);
  };

  const dAddFirst = getRandomDigits(digits['addition']?.first ?? { min: 2, max: 2 });
  const dAddSecond = getRandomDigits(digits['addition']?.second ?? { min: 2, max: 2 });
  const dSubFirst = getRandomDigits(digits['subtraction']?.first ?? { min: 2, max: 2 });
  const dSubSecond = getRandomDigits(digits['subtraction']?.second ?? { min: 2, max: 2 });
  const dMulFirst = getRandomDigits(digits['multiplication']?.first ?? { min: 1, max: 1 });
  const dMulSecond = getRandomDigits(digits['multiplication']?.second ?? { min: 1, max: 1 });
  const dDivFirst = getRandomDigits(digits['division']?.first ?? { min: 1, max: 1 });
  const dDivSecond = getRandomDigits(digits['division']?.second ?? { min: 1, max: 1 });
  const dPctFirst = getRandomDigits(digits['percent']?.first ?? { min: 2, max: 2 });
  const dPctSecond = getRandomDigits(digits['percent']?.second ?? { min: 2, max: 2 });

  const minForDigits = (d: number) => (d <= 1 ? 0 : Math.pow(10, d - 1));
  const maxForDigits = (d: number) => (d <= 1 ? 9 : Math.pow(10, d) - 1);
  if (skill === 'addition') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dAddFirst), maxForDigits(dAddFirst));
      b = randInt(minForDigits(dAddSecond), maxForDigits(dAddSecond));
      attempts++;
    } while (isTrivialAddition(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '+', operands: [a, b], correctAnswer: String(a + b), promptText: `${a} + ${b} = ?` };
  }
  if (skill === 'subtraction') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dSubFirst), maxForDigits(dSubFirst));
      b = randInt(minForDigits(dSubSecond), maxForDigits(dSubSecond));
      if (b > a) [a, b] = [b, a];
      attempts++;
    } while (isTrivialSubtraction(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '-', operands: [a, b], correctAnswer: String(a - b), promptText: `${a} - ${b} = ?` };
  }
  if (skill === 'multiplication') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dMulFirst), maxForDigits(dMulFirst));
      b = randInt(minForDigits(dMulSecond), maxForDigits(dMulSecond));
      attempts++;
    } while (isTrivialMultiplication(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '*', operands: [a, b], correctAnswer: String(a * b), promptText: `${a} × ${b} = ?` };
  }
  if (skill === 'division') {
    // choose divisor with dDivSecond digits; choose dividend with dDivFirst digits
    const maxTries = 20;
    let a = 0;
    let b = 1;
    let attempts = 0;
    
    for (let i = 0; i < maxTries; i++) {
      b = randInt(Math.max(1, minForDigits(dDivSecond)), maxForDigits(dDivSecond));
      const k = randInt(1, 9);
      const candidate = b * k;
      if (String(candidate).length <= String(maxForDigits(dDivFirst)).length || dDivFirst === 1) {
        a = candidate;
        if (!isTrivialDivision(a, b)) {
          break;
        }
      }
      a = candidate; // fallback uses last candidate even if digits differ
      attempts++;
    }
    
    // If we still have a trivial case after maxTries, try a few more attempts with different approach
    if (isTrivialDivision(a, b) && attempts < 15) {
      for (let i = 0; i < 5; i++) {
        b = randInt(Math.max(2, minForDigits(dDivSecond)), maxForDigits(dDivSecond));
        const k = randInt(2, 8);
        a = b * k;
        if (!isTrivialDivision(a, b)) {
          break;
        }
      }
    }
    
    return { id: crypto.randomUUID(), skill, operator: '/', operands: [a, b], correctAnswer: String(a / b), promptText: `${a} ÷ ${b} = ?` };
  }
  // percent-of (integer-only using user's rule, excluding 0% and 100%)
  // Loop to find N and P where Step < 100 and P ∈ [Step, 100-Step]
  let y = 0;
  let x = 0;
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    const candidateY = randInt(Math.max(1, minForDigits(dPctSecond)), maxForDigits(dPctSecond));
    const D = gcd(candidateY, 100);
    const Step = 100 / D; // integer
    if (Step >= 100) continue; // would force 100% only -> skip
    const maxK = Math.floor(100 / Step); // equals D
    if (maxK <= 1) continue; // no k in [1, maxK-1]
    const k = randInt(1, maxK - 1); // ensures x != 0 and x != 100
    y = candidateY;
    x = Step * k;
    
    // Check if this percentage calculation is trivial
    if (!isTrivialPercent(x, y)) {
      break;
    }
  }
  
  // If we still have a trivial case, try a different approach
  if (isTrivialPercent(x, y) && attempts < 50) {
    for (let i = 0; i < 10; i++) {
      y = randInt(Math.max(2, minForDigits(dPctSecond)), maxForDigits(dPctSecond));
      x = randInt(10, 90); // Avoid 0%, 100%, and very simple percentages
      if (!isTrivialPercent(x, y)) {
        break;
      }
    }
  }
  
  if (y === 0 || x === 0) {
    // Fallback safe case
    y = 200;
    x = 50;
  }
  const ans = (x * y) / 100; // guaranteed integer
  return {
    id: crypto.randomUUID(),
    skill: 'percent',
    operator: '%',
    operands: [x, y],
    correctAnswer: String(ans),
    promptText: `${x}% of ${y} = ?`,
  };
}

export default function Practice() {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const [lengthSec] = useState<number>(() => {
    const saved = Number(localStorage.getItem('lengthSec'));
    return saved === 30 || saved === 60 || saved === 120 ? saved : 60;
  });
  const [timeLeft, setTimeLeft] = useState<number>(lengthSec);
  const [currentItem, setCurrentItem] = useState<Item>(() => generateEasyItem());
  const [answer, setAnswer] = useState<string>('');
  const [flash, setFlash] = useState<'correct' | 'incorrect' | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useMemo(() => Date.now(), []);

  const [attempted, setAttempted] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [sumTimeMs, setSumTimeMs] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const lastSubmitAt = useRef<number>(Date.now());
  const endedRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);

  const endSession = (reason: 'timeout' | 'exit') => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (intervalIdRef.current != null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    const endedAt = Date.now();
    const attemptedSafe = attempted;
    const correctSafe = correctCount;
    const avgTime = attemptedSafe > 0 ? sumTimeMs / attemptedSafe : 0;
    const accuracy = attemptedSafe > 0 ? Math.round((correctSafe / attemptedSafe) * 100) : 0;
    const summary = {
      id: crypto.randomUUID(),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      settings: { skills: ['addition','subtraction','multiplication','division','percent'], difficulty: 'easy', lengthSec: lengthSec as 30|60|120, seed: reason },
      totals: { 
        attempted: attemptedSafe, 
        correct: correctSafe, 
        accuracyPct: accuracy, 
        avgTimeMs: avgTime,
        maxStreak: maxStreak,
        finalStreak: currentStreak
      },
      perSkill: {} as any,
    };
    
    try {
      // Save to localStorage
      localStorage.setItem('lastSummary', JSON.stringify(summary));
      const historyRaw = localStorage.getItem('summaries');
      const history = historyRaw ? (JSON.parse(historyRaw) as any[]) : [];
      const withNew = [summary, ...history];
      const uniqueById: Record<string, any> = {};
      for (const s of withNew) {
        if (!uniqueById[s.id]) uniqueById[s.id] = s;
      }
      const deduped = Object.values(uniqueById).slice(0, 10);
      localStorage.setItem('summaries', JSON.stringify(deduped));
    } catch (error) {
      console.error('Error saving session summary:', error);
    }
    
    navigate(`/summary/${summary.id}`);
  };

  useEffect(() => {
    inputRef.current?.focus();
    const iv = window.setInterval(() => {
      if (!isPaused) {
        setTimeLeft(t => {
          if (t <= 1) {
            window.clearInterval(iv);
            if (endedRef.current) return 0;
            endSession('timeout');
          }
          return t - 1;
        });
      }
    }, 1000);
    intervalIdRef.current = iv;
    return () => window.clearInterval(iv);
  }, [attempted, correctCount, sumTimeMs, lengthSec, navigate, startedAt, isPaused]);

  const togglePause = async () => {
    setIsPaused(!isPaused);
    await playSound('click');
  };

  async function submit() {
    const now = Date.now();
    const elapsed = now - lastSubmitAt.current;
    lastSubmitAt.current = now;
    const isCorrect = answer.trim() === currentItem.correctAnswer;
    
    // Store the correct answer before moving to next task
    setLastCorrectAnswer(currentItem.correctAnswer);
    
    setAttempted(a => a + 1);
    
    // Play sound effects
    if (isCorrect) {
      await playSound('correct');
    } else {
      await playSound('incorrect');
    }
    
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setMaxStreak(m => Math.max(m, newStreak));
      
      // Show confetti for streaks of 3, 5, 10+
      if (newStreak === 3 || newStreak === 5 || newStreak === 10 || newStreak % 10 === 0) {
        setShowConfetti(prev => prev + 1);
        await playSound('streak');
      }
      
      // Get encouragement message
      const message = getEncouragementMessage('correct', {
        streak: newStreak,
        accuracy: attempted > 0 ? (correctCount / attempted) * 100 : 0,
        isFirstCorrect: attempted === 1,
        isPersonalBest: newStreak > maxStreak
      });
      setEncouragementMessage(message);
    } else {
      setCurrentStreak(0);
      const message = getEncouragementMessage('incorrect', {
        streak: currentStreak,
        accuracy: attempted > 0 ? (correctCount / attempted) * 100 : 0
      });
      setEncouragementMessage(message);
    }
    
    setSumTimeMs(ms => ms + elapsed);
    setFlash(isCorrect ? 'correct' : 'incorrect');
    
    // Show next task immediately
    const showNextTask = () => {
      setAnswer('');
      setCurrentItem(generateEasyItem());
      inputRef.current?.focus();
    };
    
    // Clear feedback messages after delay
    const clearFeedback = () => {
      setFlash(null);
      setEncouragementMessage('');
    };
    
    // Show next task immediately
    showNextTask();
    
    // Clear feedback after appropriate delay
    if (isCorrect) {
      setTimeout(clearFeedback, 1500);
    } else {
      setTimeout(clearFeedback, 2000);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, currentItem]);

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
            <div className="flex flex-col items-center space-y-6">
              {/* Answer Input */}
              <motion.input
                ref={inputRef}
                value={answer}
                onChange={e => setAnswer(e.target.value.replace(/[^0-9\-\.]/g, ''))}
                inputMode="decimal"
                className="text-4xl font-mono text-center w-80 py-4 px-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="?"
                autoFocus
                disabled={isPaused}
              />

              {/* Submit Button */}
              <motion.button
                onClick={submit}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isPaused}
              >
                Submit (Enter)
              </motion.button>
            </div>

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


