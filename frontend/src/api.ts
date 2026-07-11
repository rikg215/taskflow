import { MOCK_TASKS, MOCK_TRACKS } from './mockData';
import type {
  ColumnName,
  DashboardStats,
  NewTaskInput,
  NewTrackInput,
  Task,
  TaskNote,
  Track,
} from './types';
import { uid } from './utils';

/**
 * API client.
 *
 *  · VITE_API_URL unset  → in-memory mock store (this file, below)
 *  · VITE_API_URL="/"    → same-origin requests to /api/* (nginx / Ingress proxy)
 *  · VITE_API_URL=<url>  → absolute base, requests to <url>/api/*
 */
const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const BASE = RAW_BASE === '' ? null : RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/+$/, '');

export const usingMockApi = BASE === null;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ————————————————————————————————————————————————————————————————
// Mock store — mirrors the backend's bookkeeping so a page reload
// during development keeps the world consistent.
// ————————————————————————————————————————————————————————————————

let tracks: Track[] = structuredClone(MOCK_TRACKS);
let tasks: Task[] = structuredClone(MOCK_TASKS);

const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));

function recalcTrack(trackId: string, taskDelta: number, completedDelta: number): void {
  tracks = tracks.map((t) => {
    if (t.id !== trackId) return t;
    const task_count = Math.max(0, t.task_count + taskDelta);
    const completed_count = Math.min(task_count, Math.max(0, t.completed_count + completedDelta));
    const completion_percent = task_count === 0 ? 0 : Math.round((completed_count / task_count) * 100);
    let status = t.status;
    if (completion_percent >= 100) status = 'shipped';
    else if (status === 'shipped') status = 'active';
    return { ...t, task_count, completed_count, completion_percent, status };
  });
}

function reindexColumn(column: ColumnName): void {
  tasks
    .filter((t) => t.column_name === column)
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((t, i) => {
      t.sort_order = i;
    });
}

// ————————————————————————————————————————————————————————————————
// Public API
// ————————————————————————————————————————————————————————————————

export const api = {
  async getTracks(): Promise<Track[]> {
    if (!usingMockApi) return http<Track[]>('/tracks');
    await delay();
    return structuredClone(tracks);
  },

  async getTasks(trackId?: string): Promise<Task[]> {
    if (!usingMockApi) {
      const q = trackId ? `?track_id=${encodeURIComponent(trackId)}` : '';
      return http<Task[]>(`/tasks${q}`);
    }
    await delay();
    const list = trackId ? tasks.filter((t) => t.track_id === trackId) : tasks;
    return structuredClone(list);
  },

  async createTask(input: NewTaskInput): Promise<Task> {
    if (!usingMockApi) return http<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) });
    await delay();
    const task: Task = {
      id: uid(),
      track_id: input.track_id,
      name: input.name,
      description: input.description,
      weight: input.weight,
      status: 'not-started',
      progress: null,
      total_steps: null,
      sort_order: tasks.filter((t) => t.column_name === input.column_name).length,
      column_name: input.column_name,
      scheduled_day: input.scheduled_day,
      completion_notes: null,
      completed_at: null,
      notes: [],
    };
    tasks.push(task);
    recalcTrack(input.track_id, +1, 0);
    return structuredClone(task);
  },

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    if (!usingMockApi) return http<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    await delay();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Task ${id} not found`);
    const prev = tasks[idx];
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next: Task = { ...prev, ...clean };

    const wasComplete = prev.status === 'complete';
    const willComplete = next.status === 'complete';
    if (patch.track_id && patch.track_id !== prev.track_id) {
      recalcTrack(prev.track_id, -1, wasComplete ? -1 : 0);
      recalcTrack(next.track_id, +1, willComplete ? +1 : 0);
    } else if (wasComplete !== willComplete) {
      recalcTrack(next.track_id, 0, willComplete ? +1 : -1);
    }

    tasks[idx] = next;
    return structuredClone(next);
  },

  async completeTask(id: string, completion_notes: string | null): Promise<Task> {
    if (!usingMockApi) {
      return http<Task>(`/tasks/${id}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ completion_notes }),
      });
    }
    await delay();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    if (task.status !== 'complete') recalcTrack(task.track_id, 0, +1);
    task.status = 'complete';
    task.completed_at = task.completed_at ?? new Date().toISOString();
    task.completion_notes = completion_notes ?? task.completion_notes;
    if (task.column_name !== 'done') {
      task.column_name = 'done';
      task.sort_order = tasks.filter((t) => t.column_name === 'done').length;
      reindexColumn('done');
    }
    return structuredClone(task);
  },

  async moveTask(id: string, column_name: ColumnName, sort_order: number): Promise<Task> {
    if (!usingMockApi) {
      return http<Task>(`/tasks/${id}/move`, {
        method: 'PUT',
        body: JSON.stringify({ column_name, sort_order }),
      });
    }
    await delay(60);
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    const from = task.column_name;
    // Shift siblings in the destination to open the slot, then place.
    tasks
      .filter((t) => t.column_name === column_name && t.id !== id && t.sort_order >= sort_order)
      .forEach((t) => {
        t.sort_order += 1;
      });
    task.column_name = column_name;
    task.sort_order = sort_order;
    reindexColumn(from);
    if (from !== column_name) reindexColumn(column_name);
    return structuredClone(task);
  },

  /** Not in the original contract — pairs with the card's delete quick-action. */
  async deleteTask(id: string): Promise<void> {
    if (!usingMockApi) return http<void>(`/tasks/${id}`, { method: 'DELETE' });
    await delay();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    tasks = tasks.filter((t) => t.id !== id);
    recalcTrack(task.track_id, -1, task.status === 'complete' ? -1 : 0);
    reindexColumn(task.column_name);
  },

  /** Not in the original contract — pairs with the Add Track modal. */
  async createTrack(input: NewTrackInput): Promise<Track> {
    if (!usingMockApi) return http<Track>('/tracks', { method: 'POST', body: JSON.stringify(input) });
    await delay();
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
    tracks.push(track);
    return structuredClone(track);
  },

  /** Notes ride along on the task in this contract (swap for POST /tasks/{id}/notes if the backend grows one). */
  async addNote(taskId: string, content: string): Promise<TaskNote> {
    const note: TaskNote = { id: uid(), task_id: taskId, content, created_at: new Date().toISOString() };
    if (!usingMockApi) {
      const task = await http<Task>(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ append_note: content }) });
      return task.notes[task.notes.length - 1] ?? note;
    }
    await delay(60);
    const task = tasks.find((t) => t.id === taskId);
    if (task) task.notes = [...task.notes, note];
    return structuredClone(note);
  },

  async getDashboard(): Promise<DashboardStats> {
    if (!usingMockApi) return http<DashboardStats>('/dashboard');
    await delay();
    const total_tasks = tracks.reduce((s, t) => s + t.task_count, 0);
    const completed_tasks = tracks.reduce((s, t) => s + t.completed_count, 0);
    return {
      total_tracks: tracks.length,
      active_tracks: tracks.filter((t) => t.status === 'active').length,
      shipped_tracks: tracks.filter((t) => t.status === 'shipped').length,
      total_tasks,
      completed_tasks,
      overall_percent: total_tasks === 0 ? 0 : Math.round((completed_tasks / total_tasks) * 100),
    };
  },
};
