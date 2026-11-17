/**
 * Shared formatting helpers.
 *
 * Kept in one place so a date never renders two different ways on two screens.
 */

/** "4 Sep" — compact, no year, for lists where space is tight. */
export function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "4 September 2026". */
export function formatLongDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "Sep 2026", for grouping a timeline by month. */
export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/**
 * A due date expressed relative to now, in the words a student would use.
 * Returns the phrase and whether it is urgent, so the caller can style it
 * without re-deriving the rule.
 */
export function describeDueDate(
  iso: string | null,
  now: Date = new Date(),
): { label: string; urgent: boolean; overdue: boolean } {
  if (!iso) {
    return { label: 'No deadline', urgent: false, overdue: false };
  }

  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) {
    return { label: 'No deadline', urgent: false, overdue: false };
  }

  const msPerDay = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const days = Math.round((startOfDue - startOfToday) / msPerDay);

  if (days < 0) {
    const overdueBy = Math.abs(days);
    return {
      label: overdueBy === 1 ? '1 day overdue' : `${overdueBy} days overdue`,
      urgent: true,
      overdue: true,
    };
  }
  if (days === 0) return { label: 'Due today', urgent: true, overdue: false };
  if (days === 1) return { label: 'Due tomorrow', urgent: true, overdue: false };
  if (days <= 7) return { label: `Due in ${days} days`, urgent: false, overdue: false };
  return { label: `Due ${formatShortDate(iso)}`, urgent: false, overdue: false };
}

/** "2h 15m" or "45m", for effort estimates. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Zero-pads an activity number to two digits: 1 becomes "01". */
export function formatActivityNumber(value: number): string {
  return value.toString().padStart(2, '0');
}

/** "3 of 5 steps". */
export function formatStepCount(done: number, total: number): string {
  return `${done} of ${total} ${total === 1 ? 'step' : 'steps'}`;
}

/** A percentage as a whole number string, clamped to 0–100. */
export function formatPercent(ratio: number): string {
  return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}

/** The greeting appropriate to the hour. */
export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The first name only, for a greeting that does not feel like a form letter. */
export function firstNameOf(fullName: string): string {
  const trimmed = fullName.trim();
  if (trimmed.length === 0) return 'there';
  return trimmed.split(/\s+/)[0];
}
