import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { addDays, computeTelemetry, diffDays, startOfDay, STATE_META } from '../telemetry';
import type { Task, Track } from '../types';
import { cx } from '../utils';

const PANEL_KEY = 'taskflow.burnchart';
const H = 172;
const PAD = { top: 12, right: 126, bottom: 18, left: 34 };
const LOOKBACK_DAYS = 56;
const LABEL_GAP = 11;

interface BurnChartProps {
  tracks: Track[];
  tasks: Task[];
}

export function BurnChart({ tracks, tasks }: BurnChartProps) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PANEL_KEY) !== 'closed';
    } catch {
      return true;
    }
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const today = startOfDay(new Date());

  const model = useMemo(() => {
    const active = tracks.filter((t) => t.status === 'active');
    const start = addDays(today, -LOOKBACK_DAYS);
    let end = addDays(today, 28);
    for (const t of active) {
      if (t.target_date) {
        const d = new Date(`${t.target_date}T00:00:00`);
        if (d > end) end = d;
      }
    }
    if (diffDays(today, end) > 120) end = addDays(today, 120);
    const span = Math.max(1, diffDays(start, end));

    const series = active
      .map((track) => {
        const tm = computeTelemetry(track, tasks, today);
        const stamped = tasks
          .filter((t) => t.track_id === track.id && t.status === 'complete' && t.completed_at)
          .map((t) => startOfDay(new Date(t.completed_at as string)))
          .sort((a, b) => a.getTime() - b.getTime());
        const baseline = track.completed_count - stamped.length;
        const points: Array<{ day: number; count: number }> = [
          { day: 0, count: baseline + stamped.filter((d) => d < start).length },
        ];
        for (let i = 0; i <= diffDays(start, today); i++) {
          const day = addDays(start, i);
          const count = baseline + stamped.filter((d) => d <= day).length;
          if (count !== points[points.length - 1].count) points.push({ day: i, count });
        }
        points.push({ day: diffDays(start, today), count: track.completed_count });
        const perDay = tm.velocityPerWeek / 7;
        const projEndDay =
          perDay > 0
            ? Math.min(span, diffDays(start, today) + Math.ceil((track.task_count - track.completed_count) / perDay))
            : null;
        return { track, tm, points, projEndDay };
      })
      .filter((s) => s.track.task_count > 0);

    const maxY = Math.max(4, ...series.map((s) => s.track.task_count));
    return { series, start, span, maxY };
  }, [tracks, tasks, today]);

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

  const iw = Math.max(200, width - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const x = (day: number) => PAD.left + (day / model.span) * iw;
  const y = (count: number) => PAD.top + ih - (count / model.maxY) * ih;
  const todayDay = diffDays(model.start, today);

  // ————— label collision avoidance: sort by target y, enforce a minimum gap —————
  const labels = useMemo(() => {
    const raw = model.series.map(({ track, tm, points, projEndDay }) => {
      const last = points[points.length - 1];
      const lx = x(projEndDay ?? last.day) + 5;
      const ly = y(projEndDay !== null ? track.task_count : last.count) + 3;
      return { id: track.id, name: track.name, color: STATE_META[tm.state].color, x: lx, y: ly };
    });
    raw.sort((a, b) => a.y - b.y);
    for (let i = 1; i < raw.length; i++) {
      if (raw[i].y - raw[i - 1].y < LABEL_GAP) raw[i].y = raw[i - 1].y + LABEL_GAP;
    }
    const overflow = raw.length ? raw[raw.length - 1].y - (PAD.top + ih + 6) : 0;
    if (overflow > 0) for (const l of raw) l.y -= overflow;
    return new Map(raw.map((l) => [l.id, l]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, width]);

  const totalDone = tracks.reduce((a, t) => a + t.completed_count, 0);
  const totalAll = tracks.reduce((a, t) => a + t.task_count, 0);

  return (
    <section className="shrink-0 border-t border-line bg-surface/60">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <TrendingUp size={13} className="text-accent" />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-dim">
            Trajectory
          </span>
          <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
            solid = flown · dashed = projected at current burn · ◇ = target
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-ink-dim">
            {totalDone}/{totalAll} · {totalAll ? Math.round((totalDone / totalAll) * 100) : 0}%
          </span>
          <ChevronDown size={14} className={cx('text-ink-faint transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div ref={wrapRef} className="px-2 pb-2">
              <svg width="100%" height={H} role="img" aria-label="Burn-up trajectory chart">
                {/* y grid */}
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <g key={f}>
                    <line
                      x1={PAD.left}
                      x2={PAD.left + iw}
                      y1={y(model.maxY * f)}
                      y2={y(model.maxY * f)}
                      stroke="rgba(170,240,205,0.06)"
                    />
                    <text
                      x={PAD.left - 6}
                      y={y(model.maxY * f) + 3}
                      textAnchor="end"
                      className="fill-ink-faint font-mono text-[9px]"
                    >
                      {Math.round(model.maxY * f)}
                    </text>
                  </g>
                ))}

                {/* NOW */}
                <line
                  x1={x(todayDay)}
                  x2={x(todayDay)}
                  y1={PAD.top}
                  y2={PAD.top + ih}
                  stroke="#3FE0A8"
                  strokeOpacity={0.55}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(63,224,168,0.5))' }}
                />
                <text x={x(todayDay) + 3} y={PAD.top + 8} className="fill-accent font-mono text-[8px] font-bold">
                  NOW
                </text>

                {model.series.map(({ track, tm, points, projEndDay }, si) => {
                  const color = STATE_META[tm.state].color;
                  const line = points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.count).toFixed(1)}`)
                    .join(' ');
                  const last = points[points.length - 1];
                  const area = `${line} L${x(last.day).toFixed(1)},${(PAD.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + ih).toFixed(1)} Z`;
                  const targetDay = track.target_date
                    ? diffDays(model.start, new Date(`${track.target_date}T00:00:00`))
                    : null;
                  const label = labels.get(track.id);
                  return (
                    <g key={track.id}>
                      {/* area under flown line — flat, whisper-quiet */}
                      <motion.path
                        d={area}
                        fill={color}
                        fillOpacity={0.05}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + si * 0.08, duration: 0.5 }}
                      />
                      {/* flown — draws itself in */}
                      <motion.path
                        d={line}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.7}
                        strokeLinejoin="round"
                        style={{ filter: `drop-shadow(0 0 3px ${color}55)` }}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: si * 0.08, duration: 0.7, ease: 'easeOut' }}
                      />
                      {/* projection */}
                      {projEndDay !== null && projEndDay > last.day && (
                        <motion.line
                          x1={x(last.day)}
                          y1={y(last.count)}
                          x2={x(projEndDay)}
                          y2={y(track.task_count)}
                          stroke={color}
                          strokeWidth={1.2}
                          strokeDasharray="3 4"
                          strokeOpacity={0.75}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 + si * 0.08, duration: 0.4 }}
                        />
                      )}
                      {/* target diamond */}
                      {targetDay !== null && targetDay >= 0 && targetDay <= model.span && (
                        <motion.path
                          d={`M${x(targetDay)},${y(track.task_count) - 4.5} l4.5,4.5 l-4.5,4.5 l-4.5,-4.5 Z`}
                          fill="none"
                          stroke="#FFB454"
                          strokeWidth={1.4}
                          style={{ filter: 'drop-shadow(0 0 3px rgba(255,180,84,0.5))' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 + si * 0.08, duration: 0.3 }}
                        >
                          <title>{`${track.name} target: ${track.target_date}`}</title>
                        </motion.path>
                      )}
                      {/* collision-avoided label */}
                      {label && (
                        <motion.text
                          x={label.x}
                          y={label.y}
                          className="font-mono text-[9px]"
                          fill={label.color}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 + si * 0.08, duration: 0.3 }}
                        >
                          {label.name.length > 17 ? `${label.name.slice(0, 16)}…` : label.name}
                        </motion.text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
