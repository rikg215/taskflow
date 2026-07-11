// ————————————————————————————————————————————————————————————————
// Domain types — mirror the FastAPI backend contract exactly.
// ————————————————————————————————————————————————————————————————

export type TrackCategory = 'cert' | 'project' | 'course' | 'side-quest' | 'meta';
export type TrackStatus = 'active' | 'shipped' | 'archived';
export type TaskStatus = 'not-started' | 'in-progress' | 'complete' | 'blocked' | 'skipped';
export type ColumnName = 'backlog' | 'todo' | 'in-progress' | 'done';

export interface Track {
  id: string;
  name: string;
  category: TrackCategory;
  priority: number;
  target_date: string | null;
  status: TrackStatus;
  completion_percent: number; // calculated server-side; mirrored client-side in mock mode
  task_count: number;
  completed_count: number;
}

export interface Task {
  id: string;
  track_id: string;
  name: string;
  description: string | null;
  weight: number;
  status: TaskStatus;
  progress: number | null;
  total_steps: number | null;
  sort_order: number;
  column_name: ColumnName;
  scheduled_day: string | null; // YYYY-MM-DD
  completion_notes: string | null;
  completed_at: string | null; // ISO timestamp
  notes: TaskNote[];
}

export interface TaskNote {
  id: string;
  task_id: string;
  content: string;
  created_at: string; // ISO timestamp
}

export interface DashboardStats {
  total_tracks: number;
  active_tracks: number;
  shipped_tracks: number;
  total_tasks: number;
  completed_tasks: number;
  overall_percent: number;
}

// ————————————————————————————————————————————————————————————————
// UI-side input shapes
// ————————————————————————————————————————————————————————————————

export interface NewTaskInput {
  name: string;
  description: string | null;
  track_id: string;
  weight: number;
  column_name: ColumnName;
  scheduled_day: string | null;
}

export interface NewTrackInput {
  name: string;
  category: TrackCategory;
  priority: number;
  target_date: string | null;
}
