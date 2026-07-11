import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronDown } from 'lucide-react';
import type { Track } from '../types';
import { cx } from '../utils';
import { HealthBar } from './HealthBar';

const PANEL_KEY = 'taskflow.panel';

export function HealthBarsPanel({ tracks }: { tracks: Track[] }) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PANEL_KEY) !== 'closed';
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(PANEL_KEY, o ? 'closed' : 'open');
      } catch {
        /* ignore */
      }
      return !o;
    });
  };

  const ordered = [...tracks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'shipped' ? 1 : -1; // shipped sink to the end
    return a.priority - b.priority || a.name.localeCompare(b.name);
  });

  const totalTasks = tracks.reduce((s, t) => s + t.task_count, 0);
  const doneTasks = tracks.reduce((s, t) => s + t.completed_count, 0);
  const overall = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <section className="shrink-0 border-t border-white/[0.06] bg-[#12141D]/70 backdrop-blur">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Activity size={13} className="text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Health Bars</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-zinc-500">
            {doneTasks}/{totalTasks} · {overall}%
          </span>
          <ChevronDown size={14} className={cx('text-zinc-500 transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid max-h-64 grid-cols-1 gap-x-8 gap-y-3 overflow-y-auto px-4 pb-4 pt-1 lg:grid-cols-2">
              {ordered.map((track) => (
                <motion.div key={track.id} layout transition={{ duration: 0.3, ease: 'easeOut' }}>
                  <HealthBar track={track} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
