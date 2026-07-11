import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { TriangleAlert, Zap } from 'lucide-react';
import { AddTaskModal } from './components/AddTaskModal';
import { AddTrackModal } from './components/AddTrackModal';
import { BurnChart } from './components/BurnChart';
import { KanbanBoard } from './components/KanbanBoard';
import { RunwayBoard } from './components/RunwayBoard';
import { Sidebar } from './components/Sidebar';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TopBar, type ViewMode } from './components/TopBar';
import { useTaskFlow } from './hooks/useTaskFlow';

type ModalState = { kind: 'task'; taskId: string } | { kind: 'add-task' } | { kind: 'add-track' } | null;

const VIEW_KEY = 'taskflow.view';

export default function App() {
  const flow = useTaskFlow();
  const [modal, setModal] = useState<ModalState>(null);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'runway';
    } catch {
      return 'runway';
    }
  });

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  if (flow.loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-base">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl border border-accent/40 bg-surface shadow-phosphor">
          <Zap size={20} className="text-accent" fill="currentColor" />
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">initializing console…</span>
      </div>
    );
  }

  const openTask = modal?.kind === 'task' ? flow.tasks.find((t) => t.id === modal.taskId) : undefined;

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex h-screen flex-col bg-base text-ink">
      <TopBar
        view={view}
        onSetView={setViewPersist}
        onAddTask={() => setModal({ kind: 'add-task' })}
        soundOn={flow.soundOn}
        onToggleSound={flow.toggleSound}
      />

      {flow.error && (
        <div className="flex items-center gap-2 border-b border-alert/20 bg-alert/10 px-4 py-2 text-xs text-alert">
          <TriangleAlert size={13} />
          {flow.error} — check VITE_API_URL or the backend service.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          tracks={flow.tracks}
          tasks={flow.tasks}
          activeTrackId={flow.activeTrackId}
          onSelect={flow.setActiveTrackId}
          onAddTrack={() => setModal({ kind: 'add-track' })}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {view === 'runway' ? (
            <RunwayBoard
              tasks={flow.tasks}
              tracks={flow.tracks}
              activeTrackId={flow.activeTrackId}
              onOpen={(taskId) => setModal({ kind: 'task', taskId })}
              onUpdate={flow.updateTask}
            />
          ) : (
            <KanbanBoard
              tasks={flow.tasks}
              tracksById={flow.tracksById}
              activeTrackId={flow.activeTrackId}
              onDragEnd={flow.onDragEnd}
              onOpen={(taskId) => setModal({ kind: 'task', taskId })}
              onUpdate={flow.updateTask}
              onDelete={flow.deleteTask}
            />
          )}
          <BurnChart tracks={flow.tracks} tasks={flow.tasks} />
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
    </MotionConfig>
  );
}
