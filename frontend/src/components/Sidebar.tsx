import { useMemo } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { usingMockApi } from '../api';
import { computeTelemetry, diffDays, STATE_META, tMinus, type TrackTelemetry } from '../telemetry';
import type { Task, Track } from '../types';
import { CATEGORY_META, cx } from '../utils';

interface SidebarProps {
  tracks: Track[];
  tasks: Task[];
  activeTrackId: string | null;
  onSelect: (trackId: string | null) => void;
  onAddTrack: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
      {children}
    </span>
  );
}

/** 8-week completion sparkline — a tiny strip chart. */
function Sparkline({ weekly, color }: { weekly: number[]; color: string }) {
  const w = 64;
  const h = 14;
  const max = Math.max(1, ...weekly);
  const step = w / weekly.length;
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden>
      {weekly.map((v, i) => {
        const bh = v === 0 ? 1.5 : Math.max(2.5, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * step + 1}
            y={h - bh}
            width={step - 2}
            height={bh}
            rx={1}
            fill={v === 0 ? 'rgba(170,240,205,0.12)' : color}
            opacity={v === 0 ? 1 : 0.45 + 0.55 * (i / (weekly.length - 1))}
          />
        );
      })}
    </svg>
  );
}

function InstrumentStrip({
  tm,
  active,
  onSelect,
}: {
  tm: TrackTelemetry;
  active: boolean;
  onSelect: () => void;
}) {
  const { track, state, velocityPerWeek, weekly, etaDate, targetDate, marginDays } = tm;
  const meta = STATE_META[state];
  const category = CATEGORY_META[track.category];
  const today = new Date();

  const readout = (() => {
    if (state === 'shipped') return 'COMPLETE';
    if (targetDate) {
      const t = tMinus(diffDays(today, targetDate));
      if (etaDate) return `${t} · ETA ${diffDays(today, etaDate)}d`;
      return `${t} · NO BURN`;
    }
    if (etaDate) return `ETA ${diffDays(today, etaDate)}d`;
    return 'NO TARGET';
  })();

  return (
    <button
      onClick={onSelect}
      title={`${track.name} — ${meta.label}${marginDays !== null ? ` (margin ${marginDays >= 0 ? '+' : ''}${marginDays}d)` : ''}${active ? ' · filtering' : ''}`}
      className={cx(
        'relative w-full rounded-md border px-2.5 py-2 text-left transition-colors',
        active ? 'border-accent/40 bg-accent/[0.07]' : 'border-transparent hover:bg-white/[0.04]',
        !active && state === 'behind' && 'bg-alert/[0.05]',
      )}
    >
      <span className="flex items-center gap-2">
        {/* status lamp */}
        <span
          className={cx('h-1.5 w-1.5 shrink-0 rounded-full', state === 'behind' && 'animate-scan')}
          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
        />
        <span className="flex-1 truncate text-[13px] font-medium text-ink">{track.name}</span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full opacity-80" style={{ background: category.color }} />
      </span>

      <span className="mt-1.5 flex items-center justify-between gap-2 pl-3.5">
        <Sparkline weekly={weekly} color={meta.color} />
        <span className="font-mono text-[10px] tabular-nums text-ink-dim">
          {velocityPerWeek.toFixed(1)}/wk
        </span>
      </span>

      <span className="mt-1 flex items-center justify-between pl-3.5">
        <span className="font-mono text-[10px] tabular-nums text-ink-faint">{readout}</span>
        <span className="font-mono text-[10px] font-semibold tracking-wider" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </span>
    </button>
  );
}

export function Sidebar({ tracks, tasks, activeTrackId, onSelect, onAddTrack }: SidebarProps) {
  const telemetry = useMemo(() => {
    const map = new Map<string, TrackTelemetry>();
    for (const t of tracks) map.set(t.id, computeTelemetry(t, tasks));
    return map;
  }, [tracks, tasks]);

  const active = tracks
    .filter((t) => t.status === 'active')
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const shipped = tracks.filter((t) => t.status === 'shipped');

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface/60">
      <div className="flex-1 overflow-y-auto px-2.5 py-4">
        <div className="px-1"><SectionLabel>Telemetry</SectionLabel></div>
        <div className="mt-2 space-y-1">
          {active.map((t) => (
            <InstrumentStrip
              key={t.id}
              tm={telemetry.get(t.id) as TrackTelemetry}
              active={activeTrackId === t.id}
              onSelect={() => onSelect(activeTrackId === t.id ? null : t.id)}
            />
          ))}
        </div>
        <button
          onClick={onAddTrack}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-ink-faint transition hover:bg-white/[0.04] hover:text-ink-dim"
        >
          <Plus size={13} />
          New track
        </button>

        {shipped.length > 0 && (
          <>
            <div className="mb-1 mt-6 flex items-center gap-1.5 px-1">
              <Trophy size={11} className="text-amber" />
              <SectionLabel>Shipped</SectionLabel>
            </div>
            <div className="space-y-1 opacity-70">
              {shipped.map((t) => (
                <InstrumentStrip
                  key={t.id}
                  tm={telemetry.get(t.id) as TrackTelemetry}
                  active={activeTrackId === t.id}
                  onSelect={() => onSelect(activeTrackId === t.id ? null : t.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {usingMockApi ? 'mock data · set VITE_API_URL' : 'api · link nominal'}
      </footer>
    </aside>
  );
}
