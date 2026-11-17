/**
 * The domain model for LABFOLIO.
 *
 * These types describe a laboratory activity and the player's progress through
 * it. They are shared across views, so they live here rather than in a view's
 * own `types.ts`.
 */

/** Where an activity sits in the workflow. */
export type ActivityStatus = 'not_started' | 'in_progress' | 'complete';

/** The kind of laboratory work, used for filtering and for the library index. */
export type ActivityCategory =
  | 'Experiment'
  | 'Field Work'
  | 'Analysis'
  | 'Microscopy'
  | 'Report';

/** One checkable task inside an activity. */
export interface ActivityStep {
  id: string;
  text: string;
  done: boolean;
}

/** A file, photo, or note attached as proof of work. */
export interface EvidenceItem {
  id: string;
  /** What it is, in the student's words: "Titration curve photo". */
  label: string;
  kind: 'photo' | 'file' | 'note';
  /** ISO timestamp. */
  addedAt: string;
}

export interface Activity {
  id: string;
  /** The activity number shown in the library index, e.g. 01. */
  number: number;
  title: string;
  /** The course this belongs to, e.g. "General Chemistry". */
  course: string;
  category: ActivityCategory;
  /** The academic period, e.g. "1st Semester · AY 2026–2027". */
  period: string;
  /** One or two sentences describing the work. */
  summary: string;
  /** What the student should be able to do afterwards. */
  objectives: string[];
  /** Ordered instructions. */
  instructions: string[];
  /** Materials and prerequisites. */
  requirements: string[];
  steps: ActivityStep[];
  evidence: EvidenceItem[];
  /** ISO date the activity was assigned. */
  assignedAt: string;
  /** ISO date it is due, or null when there is no deadline. */
  dueAt: string | null;
  /** ISO date it was completed, or null. */
  completedAt: string | null;
  /** A rough effort estimate, used in the home "continue" row. */
  estimatedMinutes: number;
}

/** The student's own profile. Deliberately small: this is not an account system. */
export interface Profile {
  displayName: string;
  /** e.g. "BS Chemistry · 3rd Year". */
  programme: string;
  /** e.g. "1st Semester · AY 2026–2027". */
  period: string;
}

/**
 * Progress is derived, never stored as a number. Storing a percentage would let
 * it drift out of sync with the steps it is supposed to describe.
 */
export interface ActivityProgress {
  status: ActivityStatus;
  /** Steps completed. */
  done: number;
  /** Steps total. */
  total: number;
  /** 0–1. */
  ratio: number;
  /** True when a due date has passed and the work is not complete. */
  overdue: boolean;
}

/** A category with its count, for the library filter bar. */
export interface CategoryCount {
  category: ActivityCategory | 'All';
  count: number;
}
