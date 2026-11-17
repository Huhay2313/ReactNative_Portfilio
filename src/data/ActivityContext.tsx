/**
 * ActivityContext: the app's data layer.
 *
 * It owns the activity list and the profile, persists both to AsyncStorage, and
 * exposes named actions rather than raw setters. Progress is always derived
 * from the steps, so a percentage can never drift away from the work it
 * describes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_ACTIVITIES, DEFAULT_PROFILE } from './defaults';
import type {
  Activity,
  ActivityCategory,
  ActivityProgress,
  CategoryCount,
  EvidenceItem,
  Profile,
} from './types';

// v2: the old v1 keys held the removed sample data, so they are not read again.
const ACTIVITIES_KEY = 'labfolio.activities.v2';
const PROFILE_KEY = 'labfolio.profile.v2';

/** A new activity as the "add" form collects it. */
export interface NewActivityInput {
  title: string;
  course: string;
  category: ActivityCategory;
  summary: string;
  dueAt: string | null;
}

interface ActivityContextValue {
  activities: Activity[];
  profile: Profile;
  isLoading: boolean;
  /** Derived progress for one activity. */
  getProgress: (activity: Activity) => ActivityProgress;
  /** One activity by id, or undefined. */
  getActivity: (id: string) => Activity | undefined;
  /** Toggles one step and persists. */
  toggleStep: (activityId: string, stepId: string) => void;
  /** Adds an evidence item to an activity. */
  addEvidence: (activityId: string, label: string, kind: 'photo' | 'file' | 'note') => void;
  /** Removes an evidence item and returns the removed entry for undo. */
  removeEvidence: (activityId: string, evidenceId: string) => EvidenceItem | null;
  /** Re-inserts a previously removed evidence item (undo). */
  restoreEvidence: (activityId: string, item: EvidenceItem) => void;
  /** Creates a new activity and returns its id. */
  addActivity: (input: NewActivityInput) => string;
  /** Updates the display name. */
  setDisplayName: (name: string) => void;
  /** Updates one or more profile fields. */
  updateProfile: (patch: Partial<Profile>) => void;
  /** Clears every activity and resets the profile. Used by Settings. */
  resetAll: () => void;
  /** Aggregate figures for the home and portfolio screens. */
  stats: ActivityStats;
}

export interface ActivityStats {
  total: number;
  complete: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  /** 0–1 across all activities, weighted by step count. */
  overallRatio: number;
  /** Total steps done across every activity. */
  stepsDone: number;
  stepsTotal: number;
  /** Evidence items collected across every activity. */
  evidenceCount: number;
  /** Completed activities, most recent first. */
  completedActivities: Activity[];
  /** In-progress activities, most recently touched first. */
  activeActivities: Activity[];
  /** Category counts including an "All" entry, for the filter bar. */
  categoryCounts: CategoryCount[];
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

/** Derives progress from the steps. This is the only place the rule lives. */
export function deriveProgress(activity: Activity, now: Date = new Date()): ActivityProgress {
  const total = activity.steps.length;
  const done = activity.steps.filter((step) => step.done).length;
  const ratio = total === 0 ? 0 : done / total;

  let status: ActivityProgress['status'];
  if (total > 0 && done === total) {
    status = 'complete';
  } else if (done > 0) {
    status = 'in_progress';
  } else {
    status = 'not_started';
  }

  const overdue =
    status !== 'complete' &&
    activity.dueAt !== null &&
    new Date(activity.dueAt).getTime() < now.getTime();

  return { status, done, total, ratio, overdue };
}

function buildStats(activities: Activity[], now: Date = new Date()): ActivityStats {
  let complete = 0;
  let inProgress = 0;
  let notStarted = 0;
  let overdue = 0;
  let stepsDone = 0;
  let stepsTotal = 0;
  let evidenceCount = 0;

  for (const activity of activities) {
    const progress = deriveProgress(activity, now);
    if (progress.status === 'complete') complete += 1;
    else if (progress.status === 'in_progress') inProgress += 1;
    else notStarted += 1;

    if (progress.overdue) overdue += 1;
    stepsDone += progress.done;
    stepsTotal += progress.total;
    evidenceCount += activity.evidence.length;
  }

  const completedActivities = activities
    .filter((activity) => deriveProgress(activity, now).status === 'complete')
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  const activeActivities = activities
    .filter((activity) => deriveProgress(activity, now).status === 'in_progress')
    .sort((a, b) => {
      // Most recently assigned first, which is the one the student is likely
      // to be working on.
      const aTime = new Date(a.assignedAt).getTime();
      const bTime = new Date(b.assignedAt).getTime();
      return bTime - aTime;
    });

  const categoryOrder: (ActivityCategory | 'All')[] = [
    'All',
    'Experiment',
    'Analysis',
    'Microscopy',
    'Field Work',
    'Report',
  ];

  const categoryCounts: CategoryCount[] = categoryOrder.map((category) => ({
    category,
    count:
      category === 'All'
        ? activities.length
        : activities.filter((activity) => activity.category === category).length,
  }));

  return {
    total: activities.length,
    complete,
    inProgress,
    notStarted,
    overdue,
    overallRatio: stepsTotal === 0 ? 0 : stepsDone / stepsTotal,
    stepsDone,
    stepsTotal,
    evidenceCount,
    completedActivities,
    activeActivities,
    categoryCounts,
  };
}

interface ActivityProviderProps {
  children: ReactNode;
  /** Skips storage. Used by tests and previews. */
  initialActivities?: Activity[];
  initialProfile?: Profile;
}

export function ActivityProvider({
  children,
  initialActivities,
  initialProfile,
}: ActivityProviderProps) {
  const isControlled = initialActivities !== undefined;

  const [activities, setActivities] = useState<Activity[]>(
    initialActivities ?? DEFAULT_ACTIVITIES,
  );
  const [profile, setProfile] = useState<Profile>(initialProfile ?? DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(!isControlled);

  // Load persisted data once.
  useEffect(() => {
    if (isControlled) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [storedActivities, storedProfile] = await Promise.all([
          AsyncStorage.getItem(ACTIVITIES_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
        ]);

        if (cancelled) return;

        if (storedActivities) {
          const parsed = JSON.parse(storedActivities) as Activity[];
          // Guard against a corrupted or outdated shape rather than crashing.
          if (Array.isArray(parsed) && parsed.every((item) => item && item.id && item.steps)) {
            setActivities(parsed);
          }
        }

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile) as Profile;
          if (parsed && typeof parsed.displayName === 'string') {
            setProfile(parsed);
          }
        }
      } catch {
        // A failed read falls back to the sample data, which is a working app.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isControlled]);

  /** Writes the list and never throws into a caller. */
  const persistActivities = useCallback(
    (next: Activity[]) => {
      if (isControlled) return;
      AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(next)).catch(() => {});
    },
    [isControlled],
  );

  const persistProfile = useCallback(
    (next: Profile) => {
      if (isControlled) return;
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)).catch(() => {});
    },
    [isControlled],
  );

  const toggleStep = useCallback(
    (activityId: string, stepId: string) => {
      setActivities((current) => {
        const next = current.map((activity) => {
          if (activity.id !== activityId) return activity;

          const steps = activity.steps.map((step) =>
            step.id === stepId ? { ...step, done: !step.done } : step,
          );

          // Completing the last step stamps the completion date; un-checking any
          // step clears it again, so the portfolio never shows a finished
          // activity that is no longer finished.
          const allDone = steps.length > 0 && steps.every((step) => step.done);
          const completedAt = allDone
            ? activity.completedAt ?? new Date().toISOString()
            : null;

          return { ...activity, steps, completedAt };
        });

        persistActivities(next);
        return next;
      });
    },
    [persistActivities],
  );

  const addEvidence = useCallback(
    (activityId: string, label: string, kind: 'photo' | 'file' | 'note') => {
      setActivities((current) => {
        const next = current.map((activity) => {
          if (activity.id !== activityId) return activity;
          return {
            ...activity,
            evidence: [
              ...activity.evidence,
              {
                id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                label,
                kind,
                addedAt: new Date().toISOString(),
              },
            ],
          };
        });
        persistActivities(next);
        return next;
      });
    },
    [persistActivities],
  );

  const removeEvidence = useCallback(
    (activityId: string, evidenceId: string): EvidenceItem | null => {
      let removed: EvidenceItem | null = null;
      setActivities((current) => {
        const next = current.map((activity) => {
          if (activity.id !== activityId) return activity;
          const target = activity.evidence.find((item) => item.id === evidenceId) ?? null;
          removed = target;
          return {
            ...activity,
            evidence: activity.evidence.filter((item) => item.id !== evidenceId),
          };
        });
        persistActivities(next);
        return next;
      });
      return removed;
    },
    [persistActivities],
  );

  const restoreEvidence = useCallback(
    (activityId: string, item: EvidenceItem) => {
      setActivities((current) => {
        const next = current.map((activity) => {
          if (activity.id !== activityId) return activity;
          if (activity.evidence.some((existing) => existing.id === item.id)) {
            return activity;
          }
          return {
            ...activity,
            evidence: [...activity.evidence, item],
          };
        });
        persistActivities(next);
        return next;
      });
    },
    [persistActivities],
  );

  const addActivity = useCallback(
    (input: NewActivityInput): string => {
      const id = `act-${Date.now()}`;
      const nextNumber =
        activities.reduce((max, activity) => Math.max(max, activity.number), 0) + 1;

      const created: Activity = {
        id,
        number: nextNumber,
        title: input.title.trim(),
        course: input.course.trim(),
        category: input.category,
        period: profile.period,
        summary: input.summary.trim(),
        objectives: [],
        instructions: [],
        requirements: [],
        // A new activity starts with one open step so it is immediately
        // actionable rather than an empty shell.
        steps: [{ id: 's1', text: 'Plan the work for this activity', done: false }],
        evidence: [],
        assignedAt: new Date().toISOString(),
        dueAt: input.dueAt,
        completedAt: null,
        estimatedMinutes: 60,
      };

      setActivities((current) => {
        const next = [created, ...current];
        persistActivities(next);
        return next;
      });

      return id;
    },
    [activities, profile.period, persistActivities],
  );

  const setDisplayName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) return;
      const next = { ...profile, displayName: trimmed };
      setProfile(next);
      persistProfile(next);
    },
    [profile, persistProfile],
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      const next: Profile = {
        displayName:
          patch.displayName !== undefined && patch.displayName.trim().length > 0
            ? patch.displayName.trim()
            : profile.displayName,
        // Programme and period are optional, so they may be cleared.
        programme:
          patch.programme !== undefined ? patch.programme.trim() : profile.programme,
        period: patch.period !== undefined ? patch.period.trim() : profile.period,
      };
      setProfile(next);
      persistProfile(next);
    },
    [profile, persistProfile],
  );

  const resetAll = useCallback(() => {
    setActivities(DEFAULT_ACTIVITIES);
    setProfile(DEFAULT_PROFILE);
    persistActivities(DEFAULT_ACTIVITIES);
    persistProfile(DEFAULT_PROFILE);
  }, [persistActivities, persistProfile]);

  const getProgress = useCallback(
    (activity: Activity) => deriveProgress(activity),
    [],
  );

  const getActivity = useCallback(
    (id: string) => activities.find((activity) => activity.id === id),
    [activities],
  );

  const stats = useMemo(() => buildStats(activities), [activities]);

  const value = useMemo<ActivityContextValue>(
    () => ({
      activities,
      profile,
      isLoading,
      getProgress,
      getActivity,
      toggleStep,
      addEvidence,
      removeEvidence,
      restoreEvidence,
      addActivity,
      setDisplayName,
      updateProfile,
      resetAll,
      stats,
    }),
    [
      activities,
      profile,
      isLoading,
      getProgress,
      getActivity,
      toggleStep,
      addEvidence,
      removeEvidence,
      restoreEvidence,
      addActivity,
      setDisplayName,
      updateProfile,
      resetAll,
      stats,
    ],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivities(): ActivityContextValue {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivities must be used inside an ActivityProvider');
  }
  return context;
}
