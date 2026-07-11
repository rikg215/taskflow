import type { Task, Track } from './types';

// ————————————————————————————————————————————————————————————————
// Date math — everything runway/telemetry needs, day-granular.
// ————————————————————————————————————————————————————————————————

export const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00`);
}

export function toDayKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Whole days from a → b (positive when b is later). */
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/** The day a task occupies on the runway: contrail (completion) beats plan. */
export function taskDay(task: Task): string | null {
  if (task.status === 'complete' && task.completed_at) return toDayKey(new Date(task.completed_at));
  return task.scheduled_day;
}

// ————————————————————————————————————————————————————————————————
// Velocity + intercept projection
// ————————————————————————————————————————————————————————————————

const VELOCITY_WINDOW_DAYS = 21;
const SPARK_WEEKS = 8;
const CAUTION_MARGIN_DAYS = 7;

export type InterceptState = 'nominal' | 'caution' | 'behind' | 'stalled' | 'idle' | 'shipped';

export interface TrackTelemetry {
  track: Track;
  /** Timestamped completions in the last 21 days, normalized to tasks/week. */
  velocityPerWeek: number;
  remaining: number;
  /** Projected completion date at current velocity; null when stalled. */
  etaDate: Date | null;
  etaDays: number | null;
  targetDate: Date | null;
  /** target − eta in days. Positive = arriving early. */
  marginDays: number | null;
  state: InterceptState;
  /** Completions per week, oldest → newest, for the sparkline. */
  weekly: number[];
}

export function computeTelemetry(track: Track, allTasks: Task[], now = new Date()): TrackTelemetry {
  const today = startOfDay(now);
  const tasks = allTasks.filter((t) => t.track_id === track.id);
  const stamped = tasks
    .filter((t) => t.status === 'complete' && t.completed_at)
    .map((t) => new Date(t.completed_at as string));

  const windowStart = addDays(today, -VELOCITY_WINDOW_DAYS);
  const inWindow = stamped.filter((d) => d >= windowStart && d <= addDays(today, 1)).length;
  const velocityPerWeek = (inWindow / VELOCITY_WINDOW_DAYS) * 7;

  const weekly: number[] = Array.from({ length: SPARK_WEEKS }, (_, i) => {
    const wEnd = addDays(today, -(SPARK_WEEKS - 1 - i) * 7 + 1);
    const wStart = addDays(wEnd, -7);
    return stamped.filter((d) => d >= wStart && d < wEnd).length;
  });

  const remaining = Math.max(0, track.task_count - track.completed_count);
  const targetDate = track.target_date ? parseDay(track.target_date) : null;

  let etaDays: number | null = null;
  let etaDate: Date | null = null;
  if (remaining > 0 && velocityPerWeek > 0) {
    etaDays = Math.ceil(remaining / (velocityPerWeek / 7));
    etaDate = addDays(today, etaDays);
  }

  const marginDays = etaDate && targetDate ? diffDays(etaDate, targetDate) : null;

  let state: InterceptState;
  if (track.status === 'shipped' || remaining === 0) state = 'shipped';
  else if (velocityPerWeek === 0) state = stamped.length === 0 && track.completed_count === 0 ? 'idle' : 'stalled';
  else if (marginDays === null) state = 'nominal';
  else if (marginDays >= 0) state = 'nominal';
  else if (marginDays >= -CAUTION_MARGIN_DAYS) state = 'caution';
  else state = 'behind';

  return { track, velocityPerWeek, remaining, etaDate, etaDays, targetDate, marginDays, state, weekly };
}

export const STATE_META: Record<InterceptState, { label: string; color: string }> = {
  nominal: { label: 'NOMINAL', color: '#3FE0A8' },
  caution: { label: 'CAUTION', color: '#FFB454' },
  behind: { label: 'BEHIND', color: '#FF5C5C' },
  stalled: { label: 'STALLED', color: '#FFB454' },
  idle: { label: 'STANDBY', color: '#5E6A63' },
  shipped: { label: 'SHIPPED', color: '#3FE0A8' },
};

/** "T-42d" / "T+3d" style countdown label. */
export function tMinus(days: number): string {
  return days >= 0 ? `T\u2212${days}d` : `T+${Math.abs(days)}d`;
}
