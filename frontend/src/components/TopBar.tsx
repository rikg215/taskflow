import { Plus, Volume2, VolumeX, Zap } from 'lucide-react';
import { cx } from '../utils';

export type ViewMode = 'runway' | 'board';

interface TopBarProps {
  view: ViewMode;
  onSetView: (v: ViewMode) => void;
  onAddTask: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export function TopBar({ view, onSetView, onAddTask, soundOn, onToggleSound }: TopBarProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent/40 bg-base shadow-phosphor">
          <Zap size={13} className="text-accent" fill="currentColor" />
        </span>
        <h1 className="font-display text-[15px] font-bold uppercase tracking-[0.22em] text-ink">
          Taskflow
        </h1>
        <span className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint md:inline">
          mission control
        </span>
      </div>

      {/* View switch */}
      <div className="flex items-center rounded-lg border border-line bg-base p-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
        {(['runway', 'board'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onSetView(v)}
            aria-pressed={view === v}
            className={cx(
              'rounded-md px-3 py-1 transition',
              view === v ? 'bg-accent/15 text-accent' : 'text-ink-faint hover:text-ink-dim',
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-2 hidden font-mono text-xs text-ink-faint lg:block">{today}</span>
        <button
          onClick={onToggleSound}
          title={soundOn ? 'Mute completion sounds' : 'Unmute completion sounds'}
          aria-label={soundOn ? 'Mute completion sounds' : 'Unmute completion sounds'}
          className="rounded-lg p-2 text-ink-faint transition hover:bg-white/5 hover:text-ink"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink shadow-phosphor transition hover:brightness-110 active:scale-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Task
        </button>
      </div>
    </header>
  );
}
