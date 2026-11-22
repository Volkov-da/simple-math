export const SKILLS = ['addition', 'subtraction', 'multiplication', 'division', 'percent'] as const;
export type Skill = (typeof SKILLS)[number];

export type SessionLength = 30 | 60 | 120;
export const SESSION_LENGTHS: readonly SessionLength[] = [30, 60, 120];

/** Inclusive range of digit counts, each in 1..4. */
export type DigitRange = { min: number; max: number };
export type OperandDigits = { first: DigitRange; second: DigitRange };

export type OpsSettings = Record<Skill, boolean>;
export type DigitSettings = Record<Skill, OperandDigits>;

export type PracticeSettings = {
  lengthSec: SessionLength;
  ops: OpsSettings;
  digits: DigitSettings;
};

export type Operator = '+' | '-' | '*' | '/' | '%';

export type Item = {
  id: string;
  skill: Skill;
  operator: Operator;
  operands: [number, number];
  correctAnswer: string;
  promptText: string;
};

export type SkillTotals = { attempted: number; correct: number; totalTimeMs: number };

export type SessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string;
  settings: {
    skills: Skill[];
    lengthSec: SessionLength;
    digits?: DigitSettings;
    /** Present on sessions saved before the settings were recorded accurately. */
    difficulty?: string;
  };
  endReason?: 'timeout' | 'exit';
  totals: {
    attempted: number;
    correct: number;
    accuracyPct: number;
    avgTimeMs: number;
    maxStreak: number;
    finalStreak: number;
  };
  perSkill: Partial<Record<Skill, SkillTotals>>;
};
