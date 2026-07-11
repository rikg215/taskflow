import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { api } from '../api';
import { sound } from '../sounds';
import type { ColumnName, NewTaskInput, NewTrackInput, Task, TaskNote, Track } from '../types';
import { uid } from '../utils';

/**
 * Applies task-count / completed-count deltas to a track and derives
 * completion_percent (matching the backend's calculation). Crossing 100%
 * flips the track to `shipped`; dropping back below 100% un-ships it.
 */
function applyTrackDelta(
  list: Track[],
  trackId: string,
  taskDelta: number,
  completedDelta: number,
): { tracks: Track[]; shippedNow: boolean } {
  let shippedNow = false;
  const next = list.map((t) => {
    if (t.id !== trackId) return t;
    const task_count = Math.max(0, t.task_count + taskDelta);
    const completed_count = Math.min(task_count, Math.max(0, t.completed_count + completedDelta));
    const completion_percent = task_count === 0 ? 0 : Math.round((completed_count / task_count) * 100);
    let status = t.status;
    if (completion_percent >= 100 && t.completion_percent < 100) {
      shippedNow = true;
      status = 'shipped';
    } else if (completion_percent < 100 && status === 'shipped') {
      status = 'active';
    }
    return { ...t, task_count, completed_count, completion_percent, status };
  });
  return { tracks: next, shippedNow };
}

export function useTaskFlow() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(sound.enabled);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tr, ts] = await Promise.all([api.getTracks(), api.getTasks()]);
        if (cancelled) return;
        setTracks(tr);
        setTasks(ts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to reach the API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tracksById = useMemo(() => {
    const map: Record<string, Track> = {};
    for (const t of tracks) map[t.id] = t;
    return map;
  }, [tracks]);

  const celebrate = useCallback((shippedNow: boolean) => {
    sound.taskComplete();
    if (shippedNow) window.setTimeout(() => sound.trackComplete(), 380);
  }, []);

  // ————————————————————————————————————————————————————————————
  // Drag & drop
  // ————————————————————————————————————————————————————————————

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const from = source.droppableId as ColumnName;
      const to = destination.droppableId as ColumnName;
      const dragged = tasks.find((t) => t.id === draggableId);
      if (!dragged) return;

      const completing = to === 'done' && dragged.status !== 'complete';
      const reopening = from === 'done' && to !== 'done' && dragged.status === 'complete';

      const updatedDragged: Task = {
        ...dragged,
        column_name: to,
        status: completing ? 'complete' : reopening ? 'in-progress' : dragged.status,
        completed_at: completing ? new Date().toISOString() : reopening ? null : dragged.completed_at,
      };

      const columnOf = (col: ColumnName) =>
        tasks
          .filter((t) => t.column_name === col && t.id !== draggableId)
          .sort((a, b) => a.sort_order - b.sort_order);

      const destList = columnOf(to);
      destList.splice(destination.index, 0, updatedDragged);
      const touched = new Map<string, Task>();
      destList.forEach((t, i) => touched.set(t.id, { ...t, sort_order: i }));
      if (from !== to) columnOf(from).forEach((t, i) => touched.set(t.id, { ...t, sort_order: i }));

      setTasks((prev) => prev.map((t) => touched.get(t.id) ?? t));

      if (completing || reopening) {
        const { tracks: nextTracks, shippedNow } = applyTrackDelta(
          tracks,
          dragged.track_id,
          0,
          completing ? +1 : -1,
        );
        setTracks(nextTracks);
        if (completing) celebrate(shippedNow);
      } else {
        sound.drop();
      }

      const moved = touched.get(draggableId);
      if (moved) void api.moveTask(draggableId, moved.column_name, moved.sort_order).catch(console.error);
      if (completing) void api.completeTask(draggableId, null).catch(console.error);
      if (reopening) {
        void api.updateTask(draggableId, { status: 'in-progress', completed_at: null }).catch(console.error);
      }
    },
    [tasks, tracks, celebrate],
  );

  // ————————————————————————————————————————————————————————————
  // CRUD
  // ————————————————————————————————————————————————————————————

  /** Batch create — Add Task modal sends the main task plus subtasks together. */
  const addTasks = useCallback(
    (inputs: NewTaskInput[]) => {
      if (inputs.length === 0) return;
      const columnCounts: Partial<Record<ColumnName, number>> = {};
      const created: Task[] = inputs.map((input) => {
        const base = tasks.filter((t) => t.column_name === input.column_name).length;
        const offset = columnCounts[input.column_name] ?? 0;
        columnCounts[input.column_name] = offset + 1;
        return {
          id: uid(),
          track_id: input.track_id,
          name: input.name,
          description: input.description,
          weight: input.weight,
          status: 'not-started',
          progress: null,
          total_steps: null,
          sort_order: base + offset,
          column_name: input.column_name,
          scheduled_day: input.scheduled_day,
          completion_notes: null,
          completed_at: null,
          notes: [],
        };
      });

      setTasks((prev) => [...prev, ...created]);
      let nextTracks = tracks;
      for (const input of inputs) {
        nextTracks = applyTrackDelta(nextTracks, input.track_id, +1, 0).tracks;
      }
      setTracks(nextTracks);
      for (const input of inputs) void api.createTask(input).catch(console.error);
    },
    [tasks, tracks],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      const prev = tasks.find((t) => t.id === id);
      if (!prev) return;

      const wasComplete = prev.status === 'complete';
      const willComplete = (patch.status ?? prev.status) === 'complete';

      let next: Task = { ...prev, ...patch };
      if (!wasComplete && willComplete) {
        next = {
          ...next,
          completed_at: new Date().toISOString(),
          column_name: 'done',
          sort_order: tasks.filter((t) => t.column_name === 'done').length,
        };
      } else if (wasComplete && !willComplete) {
        next = {
          ...next,
          completed_at: null,
          ...(prev.column_name === 'done' && !patch.column_name
            ? { column_name: 'todo' as ColumnName, sort_order: tasks.filter((t) => t.column_name === 'todo').length }
            : {}),
        };
      }

      setTasks((ts) => ts.map((t) => (t.id === id ? next : t)));

      const trackChanged = patch.track_id !== undefined && patch.track_id !== prev.track_id;
      let nextTracks = tracks;
      let shippedNow = false;
      if (trackChanged) {
        nextTracks = applyTrackDelta(nextTracks, prev.track_id, -1, wasComplete ? -1 : 0).tracks;
        const r = applyTrackDelta(nextTracks, next.track_id, +1, willComplete ? +1 : 0);
        nextTracks = r.tracks;
        shippedNow = r.shippedNow;
      } else if (wasComplete !== willComplete) {
        const r = applyTrackDelta(nextTracks, next.track_id, 0, willComplete ? +1 : -1);
        nextTracks = r.tracks;
        shippedNow = r.shippedNow;
      }
      if (nextTracks !== tracks) setTracks(nextTracks);
      if (!wasComplete && willComplete) celebrate(shippedNow);

      if (!wasComplete && willComplete) {
        void api
          .updateTask(id, { ...patch, status: undefined } as Partial<Task>)
          .then(() => api.completeTask(id, next.completion_notes ?? null))
          .catch(console.error);
      } else {
        void api.updateTask(id, patch).catch(console.error);
      }
    },
    [tasks, tracks, celebrate],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      setTasks((ts) => ts.filter((t) => t.id !== id));
      setTracks(
        applyTrackDelta(tracks, target.track_id, -1, target.status === 'complete' ? -1 : 0).tracks,
      );
      void api.deleteTask(id).catch(console.error);
    },
    [tasks, tracks],
  );

  const addTrack = useCallback((input: NewTrackInput) => {
    const track: Track = {
      id: uid(),
      name: input.name,
      category: input.category,
      priority: input.priority,
      target_date: input.target_date,
      status: 'active',
      completion_percent: 0,
      task_count: 0,
      completed_count: 0,
    };
    setTracks((tr) => [...tr, track]);
    void api.createTrack(input).catch(console.error);
  }, []);

  const addNote = useCallback((taskId: string, content: string) => {
    const note: TaskNote = { id: uid(), task_id: taskId, content, created_at: new Date().toISOString() };
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, notes: [...t.notes, note] } : t)));
    void api.addNote(taskId, content).catch(console.error);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !sound.enabled;
    sound.setEnabled(next);
    setSoundOn(next);
  }, []);

  return {
    tracks,
    tasks,
    tracksById,
    loading,
    error,
    activeTrackId,
    setActiveTrackId,
    soundOn,
    toggleSound,
    onDragEnd,
    addTasks,
    updateTask,
    deleteTask,
    addTrack,
    addNote,
  };
}

export type TaskFlow = ReturnType<typeof useTaskFlow>;
