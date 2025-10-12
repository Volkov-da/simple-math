import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const digits = savedDigitsRaw ? (JSON.parse(savedDigitsRaw) as Record<string, number>) : {
    addition: 2,
    subtraction: 2,
    multiplication: 1,
    division: 1,
    percent: 2,
  };
  const pool: Skill[] = (['addition','subtraction','multiplication','division','percent'] as Skill[]).filter(s => enabled[s]);
  const skillIndex = randInt(0, Math.max(0, pool.length - 1));
  const skill: Skill = pool[skillIndex] ?? 'addition';
  const dAdd = Math.max(1, Math.min(4, digits['addition'] ?? 2));
  const dSub = Math.max(1, Math.min(4, digits['subtraction'] ?? 2));
  const dMul = Math.max(1, Math.min(4, digits['multiplication'] ?? 1));
  const dDiv = Math.max(1, Math.min(4, digits['division'] ?? 1));
  const dPct = Math.max(1, Math.min(4, digits['percent'] ?? 2));

  const minForDigits = (d: number) => (d <= 1 ? 0 : Math.pow(10, d - 1));
  const maxForDigits = (d: number) => (d <= 1 ? 9 : Math.pow(10, d) - 1);
  if (skill === 'addition') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dAdd), maxForDigits(dAdd));
      b = randInt(minForDigits(dAdd), maxForDigits(dAdd));
      attempts++;
    } while (isTrivialAddition(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '+', operands: [a, b], correctAnswer: String(a + b), promptText: `${a} + ${b} = ?` };
  }
  if (skill === 'subtraction') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dSub), maxForDigits(dSub));
      b = randInt(minForDigits(dSub), maxForDigits(dSub));
      if (b > a) [a, b] = [b, a];
      attempts++;
    } while (isTrivialSubtraction(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '-', operands: [a, b], correctAnswer: String(a - b), promptText: `${a} - ${b} = ?` };
  }
  if (skill === 'multiplication') {
    let a, b;
    let attempts = 0;
    do {
      a = randInt(minForDigits(dMul), maxForDigits(dMul));
      b = randInt(minForDigits(dMul), maxForDigits(dMul));
      attempts++;
    } while (isTrivialMultiplication(a, b) && attempts < 20);
    
    return { id: crypto.randomUUID(), skill, operator: '*', operands: [a, b], correctAnswer: String(a * b), promptText: `${a} × ${b} = ?` };
  }
  if (skill === 'division') {
    // choose divisor with dDiv digits; choose small multiplier to keep dividend within same digit count if possible
    const maxTries = 20;
    let a = 0;
    let b = 1;
    let attempts = 0;
    
    for (let i = 0; i < maxTries; i++) {
      b = randInt(Math.max(1, minForDigits(dDiv)), maxForDigits(dDiv));
      const k = randInt(1, 9);
      const candidate = b * k;
      if (String(candidate).length === String(maxForDigits(dDiv)).length || dDiv === 1) {
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
        b = randInt(Math.max(2, minForDigits(dDiv)), maxForDigits(dDiv));
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
    const candidateY = randInt(Math.max(1, minForDigits(dPct)), maxForDigits(dPct));
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
      y = randInt(Math.max(2, minForDigits(dPct)), maxForDigits(dPct));
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
  const [lengthSec] = useState<number>(() => {
    const saved = Number(localStorage.getItem('lengthSec'));
    return saved === 30 || saved === 60 || saved === 120 ? saved : 60;
  });
  const [timeLeft, setTimeLeft] = useState<number>(lengthSec);
  const [currentItem, setCurrentItem] = useState<Item>(() => generateEasyItem());
  const [answer, setAnswer] = useState<string>('');
  const [flash, setFlash] = useState<'correct' | 'incorrect' | null>(null);
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
    const avgTime = attemptedSafe > 0 ? Math.round(sumTimeMs / attemptedSafe) : 0;
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
      setTimeLeft(t => {
        if (t <= 1) {
          window.clearInterval(iv);
          if (endedRef.current) return 0;
          endSession('timeout');
        }
        return t - 1;
      });
    }, 1000);
    intervalIdRef.current = iv;
    return () => window.clearInterval(iv);
  }, [attempted, correctCount, sumTimeMs, lengthSec, navigate, startedAt]);

  function submit() {
    const now = Date.now();
    const elapsed = now - lastSubmitAt.current;
    lastSubmitAt.current = now;
    const isCorrect = answer.trim() === currentItem.correctAnswer;
    setAttempted(a => a + 1);
    
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setCurrentStreak(s => {
        const newStreak = s + 1;
        setMaxStreak(m => Math.max(m, newStreak));
        return newStreak;
      });
    } else {
      setCurrentStreak(0);
    }
    
    setSumTimeMs(ms => ms + elapsed);
    setFlash(isCorrect ? 'correct' : 'incorrect');
    const next = () => {
      setFlash(null);
      setAnswer('');
      setCurrentItem(generateEasyItem());
      inputRef.current?.focus();
    };
    if (isCorrect) {
      setTimeout(next, 120);
    } else {
      setTimeout(next, 900);
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
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      {/* Timer bar */}
      <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }} aria-hidden>
        <div
          style={{
            height: 8,
            width: `${Math.max(0, Math.min(100, (timeLeft / lengthSec) * 100))}%`,
            background: timeLeft <= 5 ? '#e11d48' : '#10b981',
            transition: 'width 1s linear',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div>Time: <strong>{timeLeft}s</strong></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>Score: <strong>{correctCount}/{attempted}</strong></div>
          {currentStreak > 0 && (
            <div style={{ color: '#10b981', fontWeight: 'bold' }}>
              🔥 {currentStreak}
            </div>
          )}
          <button onClick={() => endSession('exit')} style={{ padding: '6px 10px', fontSize: 14 }}>Exit</button>
        </div>
      </div>
      <div style={{
        marginTop: 48,
        textAlign: 'center',
        padding: 16,
        borderRadius: 12,
        transition: 'background-color 120ms ease, box-shadow 120ms ease',
        backgroundColor: flash === 'correct' ? 'rgba(16,185,129,0.12)' : flash === 'incorrect' ? 'rgba(225,29,72,0.12)' : 'transparent',
        boxShadow: flash ? '0 0 0 4px ' + (flash === 'correct' ? 'rgba(16,185,129,0.25)' : 'rgba(225,29,72,0.25)') : 'none',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {currentItem.promptText}
        </div>
        <input
          ref={inputRef}
          value={answer}
          onChange={e => setAnswer(e.target.value.replace(/[^0-9\-\.]/g, ''))}
          inputMode="decimal"
          style={{ fontSize: 32, padding: 12, width: 260, textAlign: 'center' }}
          aria-label="Your answer"
          autoFocus
        />
        <div style={{ marginTop: 12 }}>
          <button onClick={submit} style={{ fontSize: 18, padding: '8px 16px' }}>Submit (Enter)</button>
        </div>
        {flash && (
          <div style={{ marginTop: 16, fontSize: 22, fontWeight: 600, color: flash === 'correct' ? '#059669' : '#b91c1c' }}>
            {flash === 'correct' ? 'Correct!' : `Incorrect. Answer: ${currentItem.correctAnswer}`}
          </div>
        )}
      </div>
    </div>
  );
}


