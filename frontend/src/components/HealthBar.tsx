import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Target, Trophy } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import type { Track } from '../types';
import { CATEGORY_META, cx, formatDate, healthFillStyle, healthGlow } from '../utils';

export function HealthBar({ track }: { track: Track }) {
  const pct = track.completion_percent;
  const displayed = useCountUp(pct);
  const [celebrating, setCelebrating] = useState(false);
  const prevPct = useRef(pct);
  const category = CATEGORY_META[track.category];
  const shipped = track.status === 'shipped';

  // Crossing into 100% triggers the celebration pulse.
  useEffect(() => {
    if (prevPct.current < 100 && pct >= 100) {
      setCelebrating(true);
      const t = window.setTimeout(() => setCelebrating(false), 1500);
      return () => window.clearTimeout(t);
    }
    prevPct.current = pct;
  }, [pct]);
  useEffect(() => {
    prevPct.current = pct;
  });

  return (
    <div className={cx('transition-opacity duration-300', shipped && !celebrating && 'opacity-55')}>
      <div className="grid grid-cols-[9.5rem_1fr_3.25rem] items-center gap-3">
        {/* Name */}
        <div className="flex min-w-0 items-center gap-1.5">
          {shipped && <Trophy size={12} className="shrink-0 text-amber-400" />}
          <span className="truncate text-xs font-semibold text-zinc-300" title={track.name}>
            {track.name}
          </span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: category.color }} title={category.label} />
        </div>

        {/* Track + fill */}
        <div className={cx('relative h-3 rounded-full bg-trackbg', celebrating && 'animate-pulse-glow')}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              ...healthFillStyle(pct),
              boxShadow: pct > 0 ? healthGlow(pct) : undefined,
              minWidth: pct > 0 ? 6 : 0,
            }}
          />
          <AnimatePresence>
            {pct >= 100 && (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                className="absolute right-0.5 top-1/2 -mt-2"
              >
                <CheckCircle2 size={16} className="text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Percent — monospace, right aligned */}
        <span
          className={cx(
            'text-right font-mono text-xs tabular-nums',
            pct >= 100 ? 'font-bold text-emerald-400' : 'text-zinc-400',
          )}
        >
          {displayed}%
        </span>
      </div>

      {/* Meta line */}
      <div className="mt-1 flex items-center gap-3 pl-0.5 font-mono text-[10px] text-zinc-600">
        <span>
          {track.completed_count}/{track.task_count} tasks
        </span>
        {track.target_date && (
          <span className="flex items-center gap-1">
            <Target size={9} />
            {formatDate(track.target_date)}
          </span>
        )}
        {shipped && <span className="font-bold tracking-wider text-emerald-500/80">SHIPPED</span>}
      </div>
    </div>
  );
}
