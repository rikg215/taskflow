import type { CSSProperties } from 'react';
import type { ColumnName, TaskStatus, TrackCategory } from './types';

/** Tiny className joiner. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// ————————————————————————————————————————————————————————————————
// Colors
// ————————————————————————————————————————————————————————————————

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Linear interpolation between two hex colors, t ∈ [0, 1]. */
export function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * clamp(t, 0, 1)));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}

export const HEALTH_GRADIENT = 'linear-gradient(90deg, #2CBE8C, #3FE0A8)';

/**
 * Sizes the blue→green gradient to the FULL bar width so a partial fill
 * reveals only the leading slice — the fill's edge literally shifts from
 * blue toward green as completion rises.
 */
export function healthFillStyle(percent: number): CSSProperties {
  const p = clamp(percent, 0, 100);
  return {
    background: HEALTH_GRADIENT,
    backgroundSize: p > 0 ? `${10000 / p}% 100%` : '100% 100%',
  };
}

/** Glow that intensifies with completion, shifting blue → emerald. */
export function healthGlow(percent: number): string {
  const p = clamp(percent, 0, 100) / 100;
  const color = lerpColor('#2CBE8C', '#3FE0A8', p);
  const blur = Math.round(6 + p * 16);
  const alpha = 0.22 + p * 0.38;
  return `0 0 ${blur}px ${rgba(color.startsWith('rgb') ? rgbToHex(color) : color, alpha)}, inset 0 1px 0 rgba(255,255,255,0.18)`;
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g);
  if (!m) return '#3FE0A8';
  return (
    '#' +
    m
      .slice(0, 3)
      .map((v) => Number(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

// ————————————————————————————————————————————————————————————————
// Dates
// ————————————————————————————————————————————————————————————————

function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00`);
}

export function formatDate(day: string): string {
  const d = parseDay(day);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export type DayTone = 'overdue' | 'today' | 'soon' | 'future';

export function dayBadge(day: string): { label: string; tone: DayTone } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = parseDay(day);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return { label: formatDate(day), tone: 'overdue' };
  if (diff === 0) return { label: 'Today', tone: 'today' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'soon' };
  return { label: formatDate(day), tone: 'future' };
}

export function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ————————————————————————————————————————————————————————————————
// Meta tables
// ————————————————————————————————————————————————————————————————

export const COLUMNS: Array<{ id: ColumnName; title: string; color: string }> = [
  { id: 'backlog', title: 'Backlog', color: '#5E6A63' },
  { id: 'todo', title: 'Todo', color: '#FFB454' },
  { id: 'in-progress', title: 'In Progress', color: '#6BC7E8' },
  { id: 'done', title: 'Done', color: '#3FE0A8' },
];

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  'not-started': { label: 'Not started', color: '#5E6A63' },
  'in-progress': { label: 'In progress', color: '#6BC7E8' },
  complete: { label: 'Complete', color: '#3FE0A8' },
  blocked: { label: 'Blocked', color: '#FF5C5C' },
  skipped: { label: 'Skipped', color: '#5E6A63' },
};

export const STATUS_ORDER: TaskStatus[] = [
  'not-started',
  'in-progress',
  'complete',
  'blocked',
  'skipped',
];

export const CATEGORY_META: Record<TrackCategory, { label: string; color: string }> = {
  cert: { label: 'Cert', color: '#B79CFF' },
  project: { label: 'Project', color: '#6BC7E8' },
  course: { label: 'Course', color: '#FFB454' },
  'side-quest': { label: 'Side quest', color: '#FF8FB1' },
  meta: { label: 'Meta', color: '#7FE8D9' },
};

export const CATEGORY_ORDER: TrackCategory[] = ['cert', 'project', 'course', 'side-quest', 'meta'];
