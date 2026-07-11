import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, Track } from '../types';
import { COLUMNS } from '../utils';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  tracksById: Record<string, Track>;
  activeTrackId: string | null;
  onDragEnd: (result: DropResult) => void;
  onOpen: (taskId: string) => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanBoard({
  tasks,
  tracksById,
  activeTrackId,
  onDragEnd,
  onOpen,
  onUpdate,
  onDelete,
}: KanbanBoardProps) {
  const byColumn = (col: string) =>
    tasks.filter((t) => t.column_name === col).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
      {/* Ambient glow behind the board */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 420px at 42% -12%, rgba(59,130,246,0.07), transparent 62%), radial-gradient(760px 340px at 88% 112%, rgba(16,185,129,0.05), transparent 60%)',
        }}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid h-full min-w-[880px] grid-cols-4 gap-3 px-4 pt-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={byColumn(col.id)}
              tracksById={tracksById}
              activeTrackId={activeTrackId}
              onOpen={onOpen}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </DragDropContext>
    </main>
  );
}
