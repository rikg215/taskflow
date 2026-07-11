import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Draggable, type DraggableStateSnapshot } from '@hello-pangea/dnd';
import { CalendarDays, CalendarPlus, ClipboardCheck, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import type { Task, Track } from '../types';
import { CATEGORY_META, cx, dayBadge, HEALTH_GRADIENT, rgba, STATUS_META } from '../utils';

interface TaskCardProps {
  task: Task;
  index: number;
  track: Track | undefined;
  dimmed: boolean;
  onOpen: (taskId: string) => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

/** Let cards settle with a subtle overshoot instead of the default linear drop. */
function dropStyle(style: CSSProperties | undefined, snapshot: DraggableStateSnapshot): CSSProperties | undefined {
  if (!snapshot.isDropAnimating || !snapshot.dropAnimation) return style;
  return {
    ...style,
    transition: `all ${snapshot.dropAnimation.duration}ms cubic-bezier(0.2, 1.35, 0.4, 1)`,
  };
}

function StatusDot({ status }: { status: Task['status'] }) {
  const color = STATUS_META[status].color;
  return (
    <span className="relative mt-1 flex h-2 w-2 shrink-0" title={STATUS_META[status].label}>
      {status === 'in-progress' && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
          style={{ background: color }}
        />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function TaskCard({ task, index, track, dimmed, onOpen, onUpdate, onDelete }: TaskCardProps) {
  const [scheduling, setScheduling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    };
  }, []);

  const category = track ? CATEGORY_META[track.category] : null;
  const done = task.status === 'complete';
  const scheduled = task.scheduled_day ? dayBadge(task.scheduled_day) : null;
  const stepPercent =
    task.total_steps && task.total_steps > 0 ? Math.round(((task.progress ?? 0) / task.total_steps) * 100) : null;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(task.id);
      return;
    }
    setConfirmDelete(true);
    confirmTimer.current = window.setTimeout(() => setConfirmDelete(false), 2500);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={dropStyle(provided.draggableProps.style, snapshot)}
          className={cx('transition-opacity duration-200', dimmed && 'opacity-30')}
        >
          <div
            onClick={(e) => {
              if (e.defaultPrevented) return; // suppressed click after a drag
              onOpen(task.id);
            }}
            className={cx(
              'group relative cursor-pointer rounded-xl border bg-surface p-3 transition-all duration-150',
              snapshot.isDragging
                ? 'scale-[1.02] border-accent/60 shadow-[0_14px_36px_rgba(0,0,0,0.55),0_0_22px_rgba(59,130,246,0.28)]'
                : 'border-white/[0.06] shadow-card hover:-translate-y-0.5 hover:border-white/[0.14]',
              done && 'opacity-75',
            )}
          >
            {/* Quick actions — reveal on hover */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-none absolute -right-1.5 -top-2 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-surface-2/95 p-0.5 opacity-0 shadow-lg backdrop-blur transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
            >
              <button
                onClick={() => onOpen(task.id)}
                title="Edit"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => setScheduling((s) => !s)}
                title="Schedule"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              >
                <CalendarPlus size={12} />
              </button>
              <button
                onClick={handleDeleteClick}
                title={confirmDelete ? 'Click again to delete' : 'Delete'}
                className={cx(
                  'rounded-md p-1 transition',
                  confirmDelete
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-rose-300',
                )}
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Schedule popover */}
            {scheduling && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setScheduling(false); }} />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-1 top-6 z-20 animate-fade-in rounded-lg border border-white/10 bg-surface-2 p-2 shadow-xl"
                >
                  <input
                    type="date"
                    autoFocus
                    defaultValue={task.scheduled_day ?? ''}
                    onChange={(e) => {
                      onUpdate(task.id, { scheduled_day: e.target.value || null });
                      setScheduling(false);
                    }}
                    className="rounded-md border border-white/10 bg-trackbg px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-accent/60"
                  />
                  {task.scheduled_day && (
                    <button
                      onClick={() => {
                        onUpdate(task.id, { scheduled_day: null });
                        setScheduling(false);
                      }}
                      className="ml-2 text-[11px] text-zinc-500 transition hover:text-rose-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Title row */}
            <div className="flex items-start gap-2">
              <StatusDot status={task.status} />
              <h3
                className={cx(
                  'flex-1 text-sm font-semibold leading-snug',
                  done ? 'text-zinc-400' : 'text-zinc-100',
                )}
              >
                {task.name}
              </h3>
            </div>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-4">
              {track && category && (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none"
                  style={{ background: rgba(category.color, 0.14), color: category.color }}
                  title={`${track.name} · ${category.label}`}
                >
                  {track.name}
                </span>
              )}
              <span className="flex items-center gap-1" title={`Weight ${task.weight}/10`}>
                <span className="h-1 w-5 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-zinc-400" style={{ width: `${task.weight * 10}%` }} />
                </span>
                <span className="font-mono text-[10px] text-zinc-500">{task.weight}</span>
              </span>
              {scheduled && (
                <span
                  className={cx(
                    'flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] leading-none',
                    scheduled.tone === 'overdue' && !done && 'bg-rose-500/15 text-rose-300',
                    scheduled.tone === 'today' && 'bg-accent/15 text-blue-300',
                    (scheduled.tone === 'soon' || scheduled.tone === 'future' || (scheduled.tone === 'overdue' && done)) &&
                      'bg-white/5 text-zinc-400',
                  )}
                >
                  <CalendarDays size={10} />
                  {scheduled.label}
                </span>
              )}
              {task.completion_notes && (
                <ClipboardCheck size={11} className="text-emerald-500/70" aria-label="Has resolution notes" />
              )}
              {task.notes.length > 0 && (
                <span className="flex items-center gap-0.5 text-zinc-500" title={`${task.notes.length} note(s)`}>
                  <MessageSquare size={10} />
                  <span className="font-mono text-[10px]">{task.notes.length}</span>
                </span>
              )}
            </div>

            {/* Step progress */}
            {stepPercent !== null && (
              <div className="mt-2 flex items-center gap-2 pl-4">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-trackbg">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${stepPercent}%`, background: HEALTH_GRADIENT }}
                  />
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {task.progress ?? 0}/{task.total_steps}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
