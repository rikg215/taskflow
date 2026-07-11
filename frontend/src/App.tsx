import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TriangleAlert, Zap } from 'lucide-react';
import { AddTaskModal } from './components/AddTaskModal';
import { AddTrackModal } from './components/AddTrackModal';
import { HealthBarsPanel } from './components/HealthBarsPanel';
import { KanbanBoard } from './components/KanbanBoard';
import { Sidebar } from './components/Sidebar';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TopBar } from './components/TopBar';
import { useTaskFlow } from './hooks/useTaskFlow';

type ModalState = { kind: 'task'; taskId: string } | { kind: 'add-task' } | { kind: 'add-track' } | null;

export default function App() {
  const flow = useTaskFlow();
  const [modal, setModal] = useState<ModalState>(null);

  if (flow.loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-base">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-accent to-emerald-500 shadow-[0_0_28px_rgba(59,130,246,0.5)]">
          <Zap size={20} className="text-white" fill="currentColor" />
        </span>
        <span className="font-mono text-xs text-zinc-500">booting mission control…</span>
      </div>
    );
  }

  const openTask = modal?.kind === 'task' ? flow.tasks.find((t) => t.id === modal.taskId) : undefined;

  return (
    <div className="flex h-screen flex-col bg-base text-zinc-200">
      <TopBar
        onAddTask={() => setModal({ kind: 'add-task' })}
        soundOn={flow.soundOn}
        onToggleSound={flow.toggleSound}
      />

      {flow.error && (
        <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">
          <TriangleAlert size={13} />
          {flow.error} — check VITE_API_URL or the backend service.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          tracks={flow.tracks}
          activeTrackId={flow.activeTrackId}
          onSelect={flow.setActiveTrackId}
          onAddTrack={() => setModal({ kind: 'add-track' })}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <KanbanBoard
            tasks={flow.tasks}
            tracksById={flow.tracksById}
            activeTrackId={flow.activeTrackId}
            onDragEnd={flow.onDragEnd}
            onOpen={(taskId) => setModal({ kind: 'task', taskId })}
            onUpdate={flow.updateTask}
            onDelete={flow.deleteTask}
          />
          <HealthBarsPanel tracks={flow.tracks} />
        </div>
      </div>

      <AnimatePresence>
        {openTask && (
          <TaskDetailModal
            key={`task-${openTask.id}`}
            task={openTask}
            tracks={flow.tracks}
            onClose={() => setModal(null)}
            onSave={(patch) => flow.updateTask(openTask.id, patch)}
            onAddNote={(content) => flow.addNote(openTask.id, content)}
          />
        )}
        {modal?.kind === 'add-task' && (
          <AddTaskModal
            key="add-task"
            tracks={flow.tracks.filter((t) => t.status !== 'archived')}
            defaultTrackId={flow.activeTrackId}
            onClose={() => setModal(null)}
            onCreate={flow.addTasks}
          />
        )}
        {modal?.kind === 'add-track' && (
          <AddTrackModal key="add-track" onClose={() => setModal(null)} onCreate={flow.addTrack} />
        )}
      </AnimatePresence>
    </div>
  );
}
