import { Droppable } from '@hello-pangea/dnd';
import { Inbox } from 'lucide-react';
import type { Task, Track } from '../types';
import { cx, rgba } from '../utils';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  tracksById: Record<string, Track>;
  activeTrackId: string | null;
  onOpen: (taskId: string) => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  tracksById,
  activeTrackId,
  onOpen,
  onUpdate,
  onDelete,
}: KanbanColumnProps) {
  return (
    <section className="flex min-h-0 flex-col" aria-label={`${title} column`}>
      {/* Header — 2px colored bottom border per the design brief */}
      <header
        className="flex shrink-0 items-center justify-between px-1 pb-2"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${rgba(color, 0.6)}` }} />
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-zinc-300">{title}</h2>
        </div>
        <span
          className="rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-none"
          style={{ background: rgba(color, 0.12), color }}
        >
          {tasks.length}
        </span>
      </header>

      {/* Body */}
      <div className="relative min-h-0 flex-1">
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cx(
                'h-full space-y-2 overflow-y-auto rounded-b-xl px-1 pb-10 pt-3 transition-colors duration-150',
                snapshot.isDraggingOver && 'bg-white/[0.025]',
              )}
              style={
                snapshot.isDraggingOver
                  ? { outline: `1.5px dashed ${rgba(color, 0.5)}`, outlineOffset: -6 }
                  : undefined
              }
            >
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  track={tracksById[task.track_id]}
                  dimmed={activeTrackId !== null && task.track_id !== activeTrackId}
                  onOpen={onOpen}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
              {provided.placeholder}
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="pointer-events-none flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] text-zinc-600">
                  <Inbox size={18} />
                  <span className="text-xs">Drop tasks here</span>
                </div>
              )}
            </div>
          )}
        </Droppable>
        {/* Bottom fade so long columns melt into the panel below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#141826] to-transparent" />
      </div>
    </section>
  );
}
