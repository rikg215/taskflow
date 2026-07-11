import { Check, Plus, Trophy } from 'lucide-react';
import { usingMockApi } from '../api';
import type { Track } from '../types';
import { CATEGORY_META, cx, healthFillStyle } from '../utils';

interface SidebarProps {
  tracks: Track[];
  activeTrackId: string | null;
  onSelect: (trackId: string | null) => void;
  onAddTrack: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{children}</span>;
}

function TrackRow({
  track,
  active,
  onSelect,
  shipped = false,
}: {
  track: Track;
  active: boolean;
  onSelect: () => void;
  shipped?: boolean;
}) {
  const category = CATEGORY_META[track.category];
  return (
    <button
      onClick={onSelect}
      title={`${track.name} — ${category.label}${active ? ' (filtering)' : ''}`}
      className={cx(
        'relative w-full rounded-lg px-2 py-2 text-left transition-colors',
        active ? 'bg-accent/10' : 'hover:bg-white/5',
        shipped && 'opacity-60 hover:opacity-90',
      )}
    >
      {active && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-accent" />}
      <span className="flex items-center gap-2">
        {shipped ? (
          <Trophy size={13} className="shrink-0 text-amber-400" />
        ) : (
          <span
            className={cx(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors',
              active ? 'border-accent bg-accent' : 'border-zinc-600',
            )}
          >
            {active && <Check size={10} strokeWidth={3.5} className="text-white" />}
          </span>
        )}
        <span className="flex-1 truncate text-[13px] font-medium text-zinc-200">{track.name}</span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: category.color }} />
      </span>
      <span className="mt-1.5 flex items-center gap-2 pl-[1.375rem]">
        <span className="h-1 w-[60px] overflow-hidden rounded-full bg-trackbg">
          <span
            className="block h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${track.completion_percent}%`, ...healthFillStyle(track.completion_percent) }}
          />
        </span>
        <span className={cx('font-mono text-[11px]', shipped ? 'text-emerald-400' : 'text-zinc-500')}>
          {track.completion_percent}%
        </span>
      </span>
    </button>
  );
}

export function Sidebar({ tracks, activeTrackId, onSelect, onAddTrack }: SidebarProps) {
  const active = tracks
    .filter((t) => t.status === 'active')
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const shipped = tracks.filter((t) => t.status === 'shipped');

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#12141D]/60">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Tracks</SectionLabel>
        <div className="mt-2 space-y-0.5">
          {active.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              active={activeTrackId === t.id}
              onSelect={() => onSelect(activeTrackId === t.id ? null : t.id)}
            />
          ))}
        </div>
        <button
          onClick={onAddTrack}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
        >
          <Plus size={13} />
          New track
        </button>

        {shipped.length > 0 && (
          <>
            <div className="mb-1 mt-6 flex items-center gap-1.5 px-1">
              <Trophy size={11} className="text-amber-400" />
              <SectionLabel>Shipped</SectionLabel>
            </div>
            <div className="space-y-0.5">
              {shipped.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  shipped
                  active={activeTrackId === t.id}
                  onSelect={() => onSelect(activeTrackId === t.id ? null : t.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="border-t border-white/[0.06] px-4 py-2.5 font-mono text-[10px] text-zinc-600">
        {usingMockApi ? 'MOCK DATA · set VITE_API_URL' : 'API · connected'}
      </footer>
    </aside>
  );
}
