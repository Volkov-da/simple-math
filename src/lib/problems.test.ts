import { describe, expect, it } from 'vitest';
import {
  enabledSkills,
  gcd,
  generateItem,
  generateProblem,
  isCorrectAnswer,
  isTrivialAddition,
  isTrivialDivision,
  isTrivialMultiplication,
  isTrivialPercent,
  isTrivialSubtraction,
  type Random,
} from './problems';
import { DEFAULT_DIGITS, DEFAULT_OPS } from './storage';
import { SKILLS, type DigitSettings, type OperandDigits, type Skill } from './types';

/** Deterministic PRNG so failures are reproducible. */
function mulberry32(seed: number): Random {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const digitCount = (n: number) => String(Math.abs(n)).length;
const range = (min: number, max = min) => ({ min, max });

function withDigits(skill: Skill, d: OperandDigits): DigitSettings {
  return { ...DEFAULT_DIGITS, [skill]: d };
}

function sample(skill: Skill, digits: DigitSettings = DEFAULT_DIGITS, n = 500, seed = 1) {
  const random = mulberry32(seed);
  return Array.from({ length: n }, () => generateProblem(skill, digits, random));
}

describe('gcd', () => {
  it('computes greatest common divisors', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(-8, 12)).toBe(4);
  });
});

describe('generateProblem', () => {
  it.each(SKILLS)('%s: answers are correct non-negative integers', skill => {
    for (const item of sample(skill)) {
      const [a, b] = item.operands;
      const expected = {
        addition: a + b,
        subtraction: a - b,
        multiplication: a * b,
        division: a / b,
        percent: (a * b) / 100,
      }[skill];
      expect(item.skill).toBe(skill);
      expect(Number(item.correctAnswer)).toBe(expected);
      expect(Number.isInteger(expected)).toBe(true);
      expect(expected).toBeGreaterThanOrEqual(0);
    }
  });

  it('never produces trivial problems with default settings', () => {
    const checks: Record<Skill, (a: number, b: number) => boolean> = {
      addition: isTrivialAddition,
      subtraction: isTrivialSubtraction,
      multiplication: isTrivialMultiplication,
      division: isTrivialDivision,
      percent: isTrivialPercent,
    };
    for (const skill of SKILLS) {
      for (const { operands } of sample(skill)) expect(checks[skill](...operands)).toBe(false);
    }
  });

  it('respects operand digit settings for addition and multiplication', () => {
    for (const skill of ['addition', 'multiplication'] as const) {
      const digits = withDigits(skill, { first: range(3), second: range(2) });
      for (const { operands: [a, b] } of sample(skill, digits)) {
        expect(digitCount(a)).toBe(3);
        expect(digitCount(b)).toBe(2);
      }
    }
  });

  it('respects digit ranges', () => {
    const digits = withDigits('addition', { first: range(1, 3), second: range(2) });
    const seen = new Set<number>();
    for (const { operands: [a] } of sample('addition', digits, 1000)) {
      seen.add(digitCount(a));
      expect(digitCount(a)).toBeGreaterThanOrEqual(1);
      expect(digitCount(a)).toBeLessThanOrEqual(3);
    }
    expect(seen).toEqual(new Set([1, 2, 3]));
  });

  it('subtraction keeps the larger number first', () => {
    for (const { operands: [a, b] } of sample('subtraction')) expect(a).toBeGreaterThanOrEqual(b);
  });

  it('division honors dividend and divisor digit settings', () => {
    const digits = withDigits('division', { first: range(3), second: range(1) });
    for (const { operands: [a, b] } of sample('division', digits)) {
      expect(digitCount(a)).toBe(3);
      expect(digitCount(b)).toBe(1);
      expect(a % b).toBe(0);
    }
  });

  it('division by default gives 2-digit ÷ 1-digit table problems', () => {
    for (const { operands: [a, b] } of sample('division')) {
      expect(digitCount(a)).toBe(2);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('division still yields integer answers when the dividend cannot be shorter than the divisor', () => {
    const digits = withDigits('division', { first: range(1), second: range(2) });
    for (const { operands: [a, b] } of sample('division', digits)) {
      expect(digitCount(b)).toBe(2);
      expect(a % b).toBe(0);
      expect(a / b).toBeGreaterThanOrEqual(2);
    }
  });

  it('percent uses 1–99% and the base digit setting', () => {
    const digits = withDigits('percent', { first: range(2), second: range(3) });
    for (const { operands: [pct, base] } of sample('percent', digits)) {
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(100);
      expect(digitCount(base)).toBe(3);
    }
  });

  it('works for every digit combination without throwing or producing NaN', () => {
    const random = mulberry32(42);
    for (const skill of SKILLS) {
      for (let f = 1; f <= 4; f++) {
        for (let s = 1; s <= 4; s++) {
          const digits = withDigits(skill, { first: range(f), second: range(s) });
          for (let i = 0; i < 20; i++) {
            const item = generateProblem(skill, digits, random);
            expect(Number.isFinite(Number(item.correctAnswer))).toBe(true);
          }
        }
      }
    }
  });
});

describe('generateItem', () => {
  it('only picks enabled operations', () => {
    const ops = { ...DEFAULT_OPS, addition: false, subtraction: false, percent: false };
    const random = mulberry32(7);
    const skills = new Set(Array.from({ length: 200 }, () => generateItem(ops, DEFAULT_DIGITS, random).skill));
    expect(skills).toEqual(new Set(['multiplication', 'division']));
  });

  it('falls back to addition when nothing is enabled', () => {
    const none = Object.fromEntries(SKILLS.map(s => [s, false])) as typeof DEFAULT_OPS;
    expect(enabledSkills(none)).toEqual(['addition']);
  });
});

describe('isCorrectAnswer', () => {
  it('accepts equivalent numeric input', () => {
    expect(isCorrectAnswer('42', '42')).toBe(true);
    expect(isCorrectAnswer(' 42 ', '42')).toBe(true);
    expect(isCorrectAnswer('042', '42')).toBe(true);
    expect(isCorrectAnswer('42.0', '42')).toBe(true);
  });

  it('rejects wrong or empty input', () => {
    expect(isCorrectAnswer('41', '42')).toBe(false);
    expect(isCorrectAnswer('', '0')).toBe(false);
    expect(isCorrectAnswer('-', '0')).toBe(false);
  });
});
