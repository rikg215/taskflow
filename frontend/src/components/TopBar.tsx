import { Plus, Settings, Volume2, VolumeX, Zap } from 'lucide-react';

interface TopBarProps {
  onAddTask: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export function TopBar({ onAddTask, soundOn, onToggleSound }: TopBarProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#12141D]/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-emerald-500 shadow-[0_0_14px_rgba(59,130,246,0.45)]">
          <Zap size={13} className="text-white" fill="currentColor" />
        </span>
        <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-[15px] font-extrabold tracking-tight text-transparent">
          TaskFlow
        </h1>
        <span className="hidden rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 md:inline">
          mission control
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-2 hidden font-mono text-xs text-zinc-500 lg:block">{today}</span>
        <button
          onClick={onToggleSound}
          title={soundOn ? 'Mute completion sounds' : 'Unmute completion sounds'}
          aria-label={soundOn ? 'Mute completion sounds' : 'Unmute completion sounds'}
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_0_12px_rgba(59,130,246,0.28)] transition hover:bg-blue-500 hover:shadow-[0_0_18px_rgba(59,130,246,0.5)] active:scale-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Task
        </button>
        <button
          title="Settings — coming soon"
          aria-label="Settings"
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
