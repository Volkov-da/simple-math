import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DIGITS,
  DEFAULT_LENGTH,
  DEFAULT_OPS,
  MAX_SESSIONS,
  getSession,
  loadSessions,
  loadSettings,
  migrateDigits,
  saveSession,
  saveSettings,
} from './storage';
import type { SessionSummary } from './types';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
});

function session(id: string, overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id,
    startedAt: '2026-11-22T10:00:00.000Z',
    endedAt: '2026-11-22T10:01:00.000Z',
    settings: { skills: ['addition'], lengthSec: 60 },
    totals: { attempted: 10, correct: 8, accuracyPct: 80, avgTimeMs: 3000, maxStreak: 5, finalStreak: 2 },
    perSkill: {},
    ...overrides,
  };
}

describe('migrateDigits', () => {
  it('converts the v1 format (one number per skill)', () => {
    const result = migrateDigits({ addition: 3, subtraction: 2, multiplication: 1, division: 1, percent: 2 });
    expect(result.addition).toEqual({ first: { min: 3, max: 3 }, second: { min: 3, max: 3 } });
    expect(result.division).toEqual({ first: { min: 1, max: 1 }, second: { min: 1, max: 1 } });
  });

  it('converts the v2 format (first/second numbers)', () => {
    const result = migrateDigits({ addition: { first: 3, second: 1 } });
    expect(result.addition).toEqual({ first: { min: 3, max: 3 }, second: { min: 1, max: 1 } });
    expect(result.subtraction).toEqual(DEFAULT_DIGITS.subtraction);
  });

  it('keeps the current format and repairs invalid ranges', () => {
    const result = migrateDigits({
      addition: { first: { min: 1, max: 3 }, second: { min: 2, max: 2 } },
      multiplication: { first: { min: 4, max: 2 }, second: { min: 0, max: 9 } },
    });
    expect(result.addition).toEqual({ first: { min: 1, max: 3 }, second: { min: 2, max: 2 } });
    expect(result.multiplication).toEqual({ first: { min: 2, max: 4 }, second: { min: 1, max: 4 } });
  });

  it('returns defaults for missing or garbage input', () => {
    expect(migrateDigits(null)).toEqual(DEFAULT_DIGITS);
    expect(migrateDigits('nope')).toEqual(DEFAULT_DIGITS);
    expect(migrateDigits({ addition: 'x' })).toEqual(DEFAULT_DIGITS);
  });
});

describe('settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual({ lengthSec: DEFAULT_LENGTH, ops: DEFAULT_OPS, digits: DEFAULT_DIGITS });
  });

  it('round-trips saved settings', () => {
    const ops = { ...DEFAULT_OPS, percent: false };
    saveSettings({ lengthSec: 120, ops });
    expect(loadSettings()).toMatchObject({ lengthSec: 120, ops });
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('lengthSec', '45');
    localStorage.setItem('ops', '{not json');
    expect(loadSettings()).toMatchObject({ lengthSec: DEFAULT_LENGTH, ops: DEFAULT_OPS });
  });
});

describe('sessions', () => {
  it('stores newest first without duplicates', () => {
    saveSession(session('a'));
    saveSession(session('b'));
    saveSession(session('a'));
    expect(loadSessions().map(s => s.id)).toEqual(['a', 'b']);
  });

  it(`keeps more than 10 sessions, capped at ${MAX_SESSIONS}`, () => {
    const many = Array.from({ length: MAX_SESSIONS + 5 }, (_, i) => session(`s${i}`));
    localStorage.setItem('summaries', JSON.stringify(many));
    saveSession(session('new'));
    const stored = loadSessions();
    expect(stored).toHaveLength(MAX_SESSIONS);
    expect(stored[0].id).toBe('new');
  });

  it('finds a session by id, not just the latest one', () => {
    saveSession(session('old', { totals: { ...session('x').totals, correct: 1 } }));
    saveSession(session('latest'));
    expect(getSession('old')?.totals.correct).toBe(1);
    expect(getSession('missing')).toBeNull();
    expect(getSession(undefined)).toBeNull();
  });

  it('falls back to the legacy lastSummary key', () => {
    localStorage.setItem('lastSummary', JSON.stringify(session('legacy')));
    expect(getSession('legacy')?.id).toBe('legacy');
  });

  it('drops malformed entries', () => {
    localStorage.setItem('summaries', JSON.stringify([session('ok'), { id: 'broken' }, null]));
    expect(loadSessions().map(s => s.id)).toEqual(['ok']);
  });
});
