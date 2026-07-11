import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crosshair, Target } from 'lucide-react';
import { addDays, diffDays, parseDay, startOfDay, taskDay, toDayKey } from '../telemetry';
import type { Task, Track } from '../types';
import { CATEGORY_META, cx } from '../utils';

// ————————————————————————————————————————————————————————————————
// Layout constants
// ————————————————————————————————————————————————————————————————

const ZOOMS = [18, 28, 42] as const;
const ZOOM_KEY = 'taskflow.runway.zoom';
const BLOCK_H = 30;
const BLOCK_GAP = 5;
const MIN_BLOCK_W = 88; // always readable, independent of zoom
const LANE_MIN_PAD = 10;
const LABEL_W = 152;

interface RunwayBoardProps {
  tasks: Task[];
  tracks: Track[];
  activeTrackId: string | null;
  onOpen: (taskId: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
}

interface Placed {
  task: Task;
  x: number; // px from lane start
  w: number; // px — weight-scaled
  subRow: number;
  overdue: boolean;
  done: boolean;
  seq: number; // global entrance stagger index
}

interface Lane {
  track: Track;
  rows: number;
  items: Placed[];
}

/** Weight → visual span. A weight-5 mock exam reads wider than a weight-1 video. */
function blockWidth(weight: number, dayWidth: number): number {
  return Math.max(MIN_BLOCK_W, Math.min(weight, 5) * dayWidth);
}

// ————————————————————————————————————————————————————————————————

export function RunwayBoard({ tasks, tracks, activeTrackId, onOpen, onUpdate }: RunwayBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dayWidth, setDayWidth] = useState<number>(() => {
    try {
      const z = Number(localStorage.getItem(ZOOM_KEY));
      return ZOOMS.includes(z as (typeof ZOOMS)[number]) ? z : 28;
    } catch {
      return 28;
    }
  });

  const [drag, setDrag] = useState<{ id: string; deltaDays: number } | null>(null);
  const dragRef = useRef<{ id: string; originDay: string; startX: number; moved: boolean } | null>(null);

  const today = startOfDay(new Date());

  // ————— time range —————
  const { rangeStart, totalDays } = useMemo(() => {
    let min = addDays(today, -10);
    let max = addDays(today, 21);
    for (const t of tasks) {
      const day = taskDay(t);
      if (!day) continue;
      const d = parseDay(day);
      if (d < min) min = d;
      if (d > max) max = d;
    }
    for (const tr of tracks) {
      if (tr.status === 'active' && tr.target_date) {
        const d = parseDay(tr.target_date);
        if (d > max) max = d;
      }
    }
    const start = addDays(min, -3);
    const clampedStart = diffDays(start, today) > 56 ? addDays(today, -56) : start;
    const end = addDays(max, 7);
    const clampedEnd = diffDays(today, end) > 120 ? addDays(today, 120) : end;
    return { rangeStart: clampedStart, totalDays: diffDays(clampedStart, clampedEnd) + 1 };
  }, [tasks, tracks, today]);

  const todayIndex = diffDays(rangeStart, today);
  const axisWidth = totalDays * dayWidth;

  // ————— lanes: pixel-aware greedy packing —————
  const visibleTracks = useMemo(
    () =>
      tracks
        .filter((t) => t.status === 'active')
        .filter((t) => !activeTrackId || t.id === activeTrackId)
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)),
    [tracks, activeTrackId],
  );

  const lanes: Lane[] = useMemo(() => {
    let seq = 0;
    return visibleTracks.map((track) => {
      const laneTasks = tasks
        .filter((t) => t.track_id === track.id && taskDay(t) !== null)
        .sort((a, b) => (taskDay(a) as string).localeCompare(taskDay(b) as string) || b.weight - a.weight);
      const rowEnds: number[] = []; // rightmost px occupied per sub-row
      const items: Placed[] = laneTasks.map((task) => {
        const day = taskDay(task) as string;
        const x = diffDays(rangeStart, parseDay(day)) * dayWidth + 2;
        const w = blockWidth(task.weight, dayWidth) - 4;
        let subRow = rowEnds.findIndex((end) => end + BLOCK_GAP <= x);
        if (subRow === -1) {
          subRow = rowEnds.length;
          rowEnds.push(x + w);
        } else {
          rowEnds[subRow] = x + w;
        }
        const done = task.status === 'complete';
        return { task, x, w, subRow, done, overdue: !done && parseDay(day) < today, seq: seq++ };
      });
      return { track, rows: Math.max(1, rowEnds.length), items };
    });
  }, [visibleTracks, tasks, rangeStart, today, dayWidth]);

  const unscheduled = useMemo(
    () =>
      tasks.filter(
        (t) =>
          taskDay(t) === null &&
          t.status !== 'complete' &&
          (!activeTrackId || t.track_id === activeTrackId) &&
          tracks.find((tr) => tr.id === t.track_id)?.status === 'active',
      ),
    [tasks, tracks, activeTrackId],
  );

  /** Earliest day from today whose track lane has < 2 tasks scheduled — spreads work instead of piling on today. */
  const autoSchedule = (task: Task) => {
    for (let i = 0; i < 60; i++) {
      const day = toDayKey(addDays(today, i));
      const load = tasks.filter(
        (t) => t.track_id === task.track_id && t.status !== 'complete' && t.scheduled_day === day,
      ).length;
      if (load < 2) {
        onUpdate(task.id, { scheduled_day: day });
        return;
      }
    }
    onUpdate(task.id, { scheduled_day: toDayKey(today) });
  };

  // ————— center on NOW —————
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, todayIndex * dayWidth - el.clientWidth * 0.3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayWidth]);

  const setZoom = (w: number) => {
    setDayWidth(w);
    try {
      localStorage.setItem(ZOOM_KEY, String(w));
    } catch {
      /* ignore */
    }
  };

  // ————— pointer-drag reschedule —————
  const beginDrag = (e: React.PointerEvent, task: Task) => {
    if (task.status === 'complete') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { id: task.id, originDay: taskDay(task) as string, startX: e.clientX, moved: false };
  };
  const moveDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    const deltaDays = Math.round(dx / dayWidth);
    setDrag((prev) => (prev?.id === d.id && prev.deltaDays === deltaDays ? prev : { id: d.id, deltaDays }));
  };
  const endDrag = (task: Task) => {
    const d = dragRef.current;
    dragRef.current = null;
    const delta = drag?.deltaDays ?? 0;
    setDrag(null);
    if (!d) return;
    if (!d.moved) {
      onOpen(task.id);
      return;
    }
    if (delta !== 0) onUpdate(task.id, { scheduled_day: toDayKey(addDays(parseDay(d.originDay), delta)) });
  };

  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i)),
    [rangeStart, totalDays],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header: title + zoom */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-accent" />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-dim">
            Runway
          </span>
          <span className="font-mono text-[10px] text-ink-faint">
            drag to reschedule · click to open · block width = task weight
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span className="mr-1 uppercase tracking-wider text-ink-faint">zoom</span>
          {ZOOMS.map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              aria-pressed={dayWidth === z}
              className={cx(
                'rounded border px-1.5 py-0.5 transition',
                dayWidth === z ? 'border-accent/50 text-accent' : 'border-line text-ink-faint hover:text-ink-dim',
              )}
            >
              {z === 18 ? 'S' : z === 28 ? 'M' : 'L'}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div className="relative flex min-h-full flex-col" style={{ width: LABEL_W + axisWidth }}>
          {/* ——— date axis ——— */}
          <div className="sticky top-0 z-20 flex shrink-0 border-b border-line bg-base/95 backdrop-blur">
            <div className="sticky left-0 z-10 shrink-0 border-r border-line bg-base/95" style={{ width: LABEL_W }} />
            <div className="relative" style={{ width: axisWidth, height: 44 }}>
              {days.map((d, i) => {
                const isMonthStart = d.getDate() === 1 || i === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = i === todayIndex;
                return (
                  <div
                    key={i}
                    className={cx(
                      'absolute bottom-0 top-0 border-l',
                      isMonthStart ? 'border-line' : 'border-transparent',
                    )}
                    style={{ left: i * dayWidth, width: dayWidth }}
                  >
                    {isMonthStart && (
                      <span className="absolute left-1 top-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    )}
                    {isToday ? (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm border border-accent/60 bg-accent/10 px-1 font-display text-[8px] font-bold tracking-[0.16em] text-accent shadow-phosphor">
                        NOW
                      </span>
                    ) : (
                      <span
                        className={cx(
                          'absolute bottom-0.5 left-0 right-0 text-center font-mono text-[10px] tabular-nums',
                          isWeekend ? 'text-ink-faint/50' : 'text-ink-faint',
                        )}
                      >
                        {d.getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ——— lanes (flex-grow to fill height) ——— */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* weekend shading + NOW scanline */}
            <div className="pointer-events-none absolute bottom-0 top-0" style={{ left: LABEL_W, width: axisWidth }}>
              {days.map((d, i) =>
                d.getDay() === 0 || d.getDay() === 6 ? (
                  <div
                    key={i}
                    className="absolute bottom-0 top-0 bg-white/[0.015]"
                    style={{ left: i * dayWidth, width: dayWidth }}
                  />
                ) : null,
              )}
              <div
                className="absolute bottom-0 top-0 z-10 w-px animate-scan bg-accent"
                style={{ left: todayIndex * dayWidth + dayWidth / 2, boxShadow: '0 0 10px rgba(63,224,168,0.9)' }}
              />
            </div>

            {lanes.map(({ track, rows, items }) => {
              const rowsH = rows * BLOCK_H + (rows - 1) * BLOCK_GAP;
              const category = CATEGORY_META[track.category];
              const targetIdx = track.target_date ? diffDays(rangeStart, parseDay(track.target_date)) : null;
              return (
                <div
                  key={track.id}
                  className="group/lane flex flex-1 border-b border-line/60 transition-colors hover:bg-white/[0.012]"
                  style={{ minHeight: rowsH + LANE_MIN_PAD * 2 }}
                >
                  {/* lane label */}
                  <div
                    className="sticky left-0 z-[15] flex shrink-0 items-center gap-2 border-r border-line bg-base/95 px-3 backdrop-blur"
                    style={{ width: LABEL_W }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: category.color, boxShadow: `0 0 5px ${category.color}66` }}
                    />
                    <span className="truncate font-mono text-[11px] text-ink-dim transition-colors group-hover/lane:text-ink">
                      {track.name}
                    </span>
                  </div>

                  {/* lane stage — blocks vertically centered in whatever height the lane gets */}
                  <div className="relative flex-1" style={{ width: axisWidth }}>
                    {targetIdx !== null && targetIdx >= 0 && targetIdx < totalDays && (
                      <div
                        className="absolute top-1/2 z-[5] -translate-y-1/2"
                        style={{ left: targetIdx * dayWidth + dayWidth / 2 - 6 }}
                        title={`Target: ${track.target_date}`}
                      >
                        <Target size={12} className="text-amber drop-shadow-[0_0_4px_rgba(255,180,84,0.6)]" strokeWidth={2.5} />
                      </div>
                    )}

                    {items.map(({ task, x, w, subRow, done, overdue, seq }) => {
                      const dragging = drag?.id === task.id;
                      const ghostOffset = dragging ? (drag?.deltaDays ?? 0) * dayWidth : 0;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(seq * 0.02, 0.6), duration: 0.28, ease: 'easeOut' }}
                          role="button"
                          tabIndex={0}
                          onPointerDown={(e) => beginDrag(e, task)}
                          onPointerMove={moveDrag}
                          onPointerUp={() => endDrag(task)}
                          onKeyDown={(e) => e.key === 'Enter' && onOpen(task.id)}
                          title={`${task.name} · weight ${task.weight}${done ? ' · complete' : overdue ? ' · OVERDUE' : ''}`}
                          className={cx(
                            'runway-block group absolute flex select-none items-center gap-1.5 overflow-hidden rounded-md border px-2 font-mono text-[10.5px] leading-none transition-[border-color,background-color,box-shadow]',
                            dragging && 'dragging',
                            done
                              ? 'border-accent/20 bg-accent/[0.05] text-ink-faint'
                              : overdue
                                ? 'cursor-grab border-alert/60 bg-alert/10 text-ink shadow-[0_0_8px_rgba(255,92,92,0.15)] hover:bg-alert/15'
                                : 'cursor-grab border-amber/35 bg-surface-2 text-ink hover:border-amber/80 hover:shadow-[0_0_10px_rgba(255,180,84,0.18)]',
                          )}
                          style={{
                            left: x + ghostOffset,
                            top: `calc(50% - ${rowsH / 2}px + ${subRow * (BLOCK_H + BLOCK_GAP)}px)`,
                            width: w,
                            height: BLOCK_H,
                          }}
                        >
                          {done ? (
                            <Check size={10} className="shrink-0 text-accent" strokeWidth={3} />
                          ) : (
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdate(task.id, { status: 'complete' });
                              }}
                              title="Mark complete"
                              aria-label={`Mark ${task.name} complete`}
                              className="hidden h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-accent/50 text-accent transition hover:bg-accent/20 group-hover:flex"
                            >
                              <Check size={9} strokeWidth={3} />
                            </button>
                          )}
                          <span className={cx('truncate', done && 'line-through decoration-accent/40')}>{task.name}</span>
                          {task.weight > 1 && !done && (
                            <span className="ml-auto shrink-0 text-[9px] tabular-nums text-ink-faint">w{task.weight}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {lanes.length === 0 && (
              <div className="p-8 font-mono text-xs text-ink-faint">No active tracks on the runway. Add a track to begin.</div>
            )}
          </div>
        </div>
      </div>

      {/* ——— holding pattern ——— */}
      <div className="shrink-0 border-t border-line bg-surface/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
            Holding pattern
          </span>
          <span className="shrink-0 rounded border border-line px-1 font-mono text-[10px] tabular-nums text-ink-dim">
            {unscheduled.length}
          </span>
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
            {unscheduled.length === 0 ? (
              <span className="font-mono text-[10px] text-ink-faint/70">all tasks scheduled — clean board</span>
            ) : (
              unscheduled.map((t) => (
                <span
                  key={t.id}
                  className="flex shrink-0 items-center gap-1.5 rounded border border-line bg-surface-2 py-1 pl-2 pr-1 font-mono text-[10px] text-ink-dim transition-colors hover:border-white/15"
                >
                  <button onClick={() => onOpen(t.id)} className="max-w-[180px] truncate hover:text-ink" title={t.name}>
                    {t.name}
                  </button>
                  <button
                    onClick={() => autoSchedule(t)}
                    title="Slot into the earliest open day for this track"
                    className="rounded border border-accent/40 px-1 py-px text-[9px] uppercase tracking-wider text-accent transition hover:bg-accent/15"
                  >
                    slot
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
