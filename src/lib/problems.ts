import { SKILLS, type DigitRange, type Item, type OpsSettings, type DigitSettings, type Skill } from './types';
import { DEFAULT_DIGITS } from './storage';

/** Returns a float in [0, 1). Injected so tests can use a seeded generator. */
export type Random = () => number;

const MAX_ATTEMPTS = 50;

export function randInt(random: Random, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

/** Smallest value with `d` digits. 1-digit operands include 0 (trivial checks reject it). */
export const minForDigits = (d: number) => (d <= 1 ? 0 : 10 ** (d - 1));
export const maxForDigits = (d: number) => 10 ** d - 1;

function pickDigits(random: Random, range: DigitRange) {
  const min = Math.max(1, Math.min(4, range.min));
  const max = Math.max(min, Math.min(4, range.max));
  return randInt(random, min, max);
}

export const isTrivialAddition = (a: number, b: number) => a <= 1 || b <= 1;
export const isTrivialSubtraction = (a: number, b: number) => a === 0 || b === 0 || a - b === 1;
export const isTrivialMultiplication = (a: number, b: number) => a <= 1 || b <= 1;
export const isTrivialDivision = (a: number, b: number) => b <= 1 || a === 0 || a === b || a % b !== 0;
export const isTrivialPercent = (pct: number, base: number) => pct <= 0 || pct >= 100 || base <= 1;

/** Draws operand pairs until `isTrivial` rejects none, keeping the last draw if attempts run out. */
function draw(make: () => [number, number], isTrivial: (a: number, b: number) => boolean) {
  let pair = make();
  for (let i = 1; i < MAX_ATTEMPTS && isTrivial(...pair); i++) pair = make();
  return pair;
}

function operand(random: Random, range: DigitRange) {
  const d = pickDigits(random, range);
  return randInt(random, minForDigits(d), maxForDigits(d));
}

function makeDivision(random: Random, digits: DigitSettings['division']): [number, number] {
  // Divisor has `second` digits; the quotient is chosen so the dividend has `first` digits.
  const divisorDigits = pickDigits(random, digits.second);
  const dividendDigits = pickDigits(random, digits.first);
  const b = randInt(random, Math.max(2, minForDigits(divisorDigits)), maxForDigits(divisorDigits));
  const minA = Math.max(1, minForDigits(dividendDigits));
  const maxA = maxForDigits(dividendDigits);
  const kMin = Math.max(2, Math.ceil(minA / b));
  const kMax = Math.floor(maxA / b);
  // If the dividend can't have the requested digits (e.g. it is shorter than the divisor),
  // fall back to a small quotient rather than producing a non-integer answer.
  const k = kMin <= kMax ? randInt(random, kMin, kMax) : randInt(random, 2, 9);
  return [b * k, b];
}

function makePercent(random: Random, digits: DigitSettings['percent']): [number, number] {
  // "pct% of base" with an integer answer: pct must be a multiple of 100 / gcd(base, 100).
  for (let i = 0; i < MAX_ATTEMPTS * 2; i++) {
    const d = pickDigits(random, digits.second);
    const base = randInt(random, Math.max(2, minForDigits(d)), maxForDigits(d));
    const step = 100 / gcd(base, 100);
    const steps = 100 / step; // how many multiples of `step` fit in 100
    if (steps <= 1) continue; // only 0% or 100% would give an integer
    const pct = step * randInt(random, 1, steps - 1);
    if (!isTrivialPercent(pct, base)) return [pct, base];
  }
  return [50, 200];
}

export function generateProblem(
  skill: Skill,
  digits: DigitSettings = DEFAULT_DIGITS,
  random: Random = Math.random,
  id: string = crypto.randomUUID(),
): Item {
  const d = digits[skill] ?? DEFAULT_DIGITS[skill];
  switch (skill) {
    case 'addition': {
      const [a, b] = draw(() => [operand(random, d.first), operand(random, d.second)], isTrivialAddition);
      return { id, skill, operator: '+', operands: [a, b], correctAnswer: String(a + b), promptText: `${a} + ${b} = ?` };
    }
    case 'subtraction': {
      const [a, b] = draw(
        () => {
          const x = operand(random, d.first);
          const y = operand(random, d.second);
          return x >= y ? [x, y] : [y, x];
        },
        isTrivialSubtraction,
      );
      return { id, skill, operator: '-', operands: [a, b], correctAnswer: String(a - b), promptText: `${a} - ${b} = ?` };
    }
    case 'multiplication': {
      const [a, b] = draw(() => [operand(random, d.first), operand(random, d.second)], isTrivialMultiplication);
      return { id, skill, operator: '*', operands: [a, b], correctAnswer: String(a * b), promptText: `${a} × ${b} = ?` };
    }
    case 'division': {
      const [a, b] = draw(() => makeDivision(random, d), isTrivialDivision);
      return { id, skill, operator: '/', operands: [a, b], correctAnswer: String(a / b), promptText: `${a} ÷ ${b} = ?` };
    }
    case 'percent': {
      const [pct, base] = makePercent(random, d);
      return {
        id,
        skill,
        operator: '%',
        operands: [pct, base],
        correctAnswer: String((pct * base) / 100),
        promptText: `${pct}% of ${base} = ?`,
      };
    }
  }
}

export function enabledSkills(ops: OpsSettings): Skill[] {
  const enabled = SKILLS.filter(s => ops[s]);
  return enabled.length > 0 ? enabled : ['addition'];
}

/** Picks a random enabled operation and generates a problem for it. */
export function generateItem(ops: OpsSettings, digits: DigitSettings, random: Random = Math.random): Item {
  const pool = enabledSkills(ops);
  return generateProblem(pool[randInt(random, 0, pool.length - 1)], digits, random);
}

/** Compares a typed answer with the expected one, tolerating whitespace and leading zeros. */
export function isCorrectAnswer(input: string, expected: string) {
  const trimmed = input.trim();
  if (trimmed === '') return false;
  return trimmed === expected || Number(trimmed) === Number(expected);
}
