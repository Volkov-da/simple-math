import {
  SESSION_LENGTHS,
  SKILLS,
  type DigitRange,
  type DigitSettings,
  type OpsSettings,
  type PracticeSettings,
  type SessionLength,
  type SessionSummary,
} from './types';

/**
 * Single access point for persisted app data. Pages must not touch localStorage directly,
 * so that a future sync backend can be plugged in behind these functions.
 */

const KEYS = {
  lengthSec: 'lengthSec',
  ops: 'ops',
  digits: 'digits',
  sessions: 'summaries',
  /** Legacy: most recent session, written by older versions. Read-only fallback. */
  lastSummary: 'lastSummary',
} as const;

/** Keeps localStorage well under its ~5 MB quota (a session is roughly 1 KB). */
export const MAX_SESSIONS = 1000;

export const DEFAULT_OPS: OpsSettings = {
  addition: true,
  subtraction: true,
  multiplication: true,
  division: true,
  percent: true,
};

const fixed = (d: number): DigitRange => ({ min: d, max: d });

export const DEFAULT_DIGITS: DigitSettings = {
  addition: { first: fixed(2), second: fixed(2) },
  subtraction: { first: fixed(2), second: fixed(2) },
  multiplication: { first: fixed(1), second: fixed(1) },
  // 2-digit dividend ÷ 1-digit divisor matches the multiplication-table division
  // that older versions produced regardless of the dividend setting.
  division: { first: fixed(2), second: fixed(1) },
  percent: { first: fixed(2), second: fixed(2) },
};

export const DEFAULT_LENGTH: SessionLength = 60;

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving "${key}":`, error);
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clampDigits = (d: number) => Math.max(1, Math.min(4, Math.round(d)));

function normalizeRange(v: unknown, fallback: DigitRange): DigitRange {
  if (isNum(v)) return fixed(clampDigits(v));
  if (v && typeof v === 'object' && isNum((v as DigitRange).min) && isNum((v as DigitRange).max)) {
    const min = clampDigits((v as DigitRange).min);
    const max = clampDigits((v as DigitRange).max);
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }
  return fallback;
}

/**
 * Accepts every historical `digits` format and returns the current one:
 *  - v1: `{ addition: 2, ... }` (one digit count per skill)
 *  - v2: `{ addition: { first: 2, second: 1 }, ... }`
 *  - v3: `{ addition: { first: {min,max}, second: {min,max} }, ... }` (current)
 */
export function migrateDigits(raw: unknown): DigitSettings {
  const result = structuredClone(DEFAULT_DIGITS);
  if (!raw || typeof raw !== 'object') return result;
  for (const skill of SKILLS) {
    const entry = (raw as Record<string, unknown>)[skill];
    if (isNum(entry)) {
      result[skill] = { first: fixed(clampDigits(entry)), second: fixed(clampDigits(entry)) };
    } else if (entry && typeof entry === 'object') {
      const { first, second } = entry as Record<string, unknown>;
      result[skill] = {
        first: normalizeRange(first, DEFAULT_DIGITS[skill].first),
        second: normalizeRange(second, DEFAULT_DIGITS[skill].second),
      };
    }
  }
  return result;
}

export function migrateOps(raw: unknown): OpsSettings {
  const result = { ...DEFAULT_OPS };
  if (!raw || typeof raw !== 'object') return result;
  for (const skill of SKILLS) {
    const v = (raw as Record<string, unknown>)[skill];
    if (typeof v === 'boolean') result[skill] = v;
  }
  return result;
}

export function parseLength(raw: unknown): SessionLength {
  const n = Number(raw);
  return (SESSION_LENGTHS as readonly number[]).includes(n) ? (n as SessionLength) : DEFAULT_LENGTH;
}

export function loadSettings(): PracticeSettings {
  let rawLength: string | null = null;
  try {
    rawLength = localStorage.getItem(KEYS.lengthSec);
  } catch {
    /* storage unavailable */
  }
  return {
    lengthSec: parseLength(rawLength),
    ops: migrateOps(readJson(KEYS.ops)),
    digits: migrateDigits(readJson(KEYS.digits)),
  };
}

export function saveSettings(settings: Partial<PracticeSettings>) {
  if (settings.lengthSec !== undefined) {
    try {
      localStorage.setItem(KEYS.lengthSec, String(settings.lengthSec));
    } catch (error) {
      console.error('Error saving session length:', error);
    }
  }
  if (settings.ops) writeJson(KEYS.ops, settings.ops);
  if (settings.digits) writeJson(KEYS.digits, settings.digits);
}

function isSession(v: unknown): v is SessionSummary {
  if (!v || typeof v !== 'object') return false;
  const s = v as SessionSummary;
  return typeof s.id === 'string' && typeof s.startedAt === 'string' && !!s.totals && isNum(s.totals.attempted);
}

/** All saved sessions, newest first. */
export function loadSessions(): SessionSummary[] {
  const raw = readJson(KEYS.sessions);
  return Array.isArray(raw) ? raw.filter(isSession) : [];
}

export function saveSession(session: SessionSummary) {
  const seen = new Set<string>();
  const next = [session, ...loadSessions()].filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  writeJson(KEYS.sessions, next.slice(0, MAX_SESSIONS));
}

export function getSession(id: string | undefined): SessionSummary | null {
  if (!id) return null;
  const found = loadSessions().find(s => s.id === id);
  if (found) return found;
  const legacy = readJson(KEYS.lastSummary);
  return isSession(legacy) && legacy.id === id ? legacy : null;
}
