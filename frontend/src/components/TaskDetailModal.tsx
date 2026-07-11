import { useMemo, useState } from 'react';
import { ClipboardCheck, ListChecks, MessageSquare, Minus, Pencil, Plus, Send } from 'lucide-react';
import type { Task, TaskStatus, Track } from '../types';
import { clamp, cx, formatDateTime, STATUS_META, STATUS_ORDER } from '../utils';
import { Markdown } from './Markdown';
import { Modal } from './Modal';
import { Button, fieldCls, Label, Select, TextArea, TextInput } from './ui';

interface TaskDetailModalProps {
  task: Task;
  tracks: Track[];
  onClose: () => void;
  onSave: (patch: Partial<Task>) => void;
  onAddNote: (content: string) => void;
}

interface Draft {
  name: string;
  description: string;
  track_id: string;
  weight: number;
  status: TaskStatus;
  progress: number | null;
  total_steps: number | null;
  scheduled_day: string;
  completion_notes: string;
}

export function TaskDetailModal({ task, tracks, onClose, onSave, onAddNote }: TaskDetailModalProps) {
  const [draft, setDraft] = useState<Draft>({
    name: task.name,
    description: task.description ?? '',
    track_id: task.track_id,
    weight: task.weight,
    status: task.status,
    progress: task.progress,
    total_steps: task.total_steps,
    scheduled_day: task.scheduled_day ?? '',
    completion_notes: task.completion_notes ?? '',
  });
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [noteInput, setNoteInput] = useState('');

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const completing = draft.status === 'complete';
  const hasSteps = draft.total_steps !== null && draft.total_steps > 0;

  const dirty = useMemo(() => {
    return (
      draft.name !== task.name ||
      draft.description !== (task.description ?? '') ||
      draft.track_id !== task.track_id ||
      draft.weight !== task.weight ||
      draft.status !== task.status ||
      draft.progress !== task.progress ||
      draft.total_steps !== task.total_steps ||
      draft.scheduled_day !== (task.scheduled_day ?? '') ||
      draft.completion_notes !== (task.completion_notes ?? '')
    );
  }, [draft, task]);

  const save = () => {
    if (!draft.name.trim()) return;
    onSave({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      track_id: draft.track_id,
      weight: draft.weight,
      status: draft.status,
      progress: draft.progress,
      total_steps: draft.total_steps,
      scheduled_day: draft.scheduled_day || null,
      completion_notes: draft.completion_notes.trim() || null,
    });
    onClose();
  };

  const submitNote = () => {
    const content = noteInput.trim();
    if (!content) return;
    onAddNote(content);
    setNoteInput('');
  };

  return (
    <Modal
      title="Task details"
      icon={<Pencil size={14} className="text-accent" />}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!dirty || !draft.name.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <TextInput
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          className="text-[15px] font-semibold"
          placeholder="Task name"
          aria-label="Task name"
        />

        {/* Description with Write / Preview */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Description</Label>
            <div className="flex overflow-hidden rounded-md border border-white/[0.08] text-[11px]">
              {(['write', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cx(
                    'px-2.5 py-1 font-medium capitalize transition',
                    tab === t ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === 'write' ? (
            <TextArea
              rows={4}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Markdown supported — **bold**, `code`, - lists…"
            />
          ) : (
            <div className="min-h-[6.5rem] rounded-lg border border-white/[0.08] bg-trackbg px-3 py-2.5">
              {draft.description.trim() ? (
                <Markdown source={draft.description} />
              ) : (
                <span className="text-sm text-zinc-600">Nothing to preview.</span>
              )}
            </div>
          )}
        </div>

        {/* Track / status / day */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <Label>Track</Label>
            <Select value={draft.track_id} onChange={(e) => set('track_id', e.target.value)}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Status</Label>
            <Select value={draft.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Scheduled day</Label>
            <input
              type="date"
              value={draft.scheduled_day}
              onChange={(e) => set('scheduled_day', e.target.value)}
              className={cx(fieldCls, 'font-mono text-xs')}
            />
          </label>
        </div>

        {/* Weight slider */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Weight</Label>
            <span className="font-mono text-xs text-zinc-400">{draft.weight}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={draft.weight}
            onChange={(e) => set('weight', Number(e.target.value))}
            className="w-full"
            aria-label="Weight"
          />
        </div>

        {/* Step progress */}
        <div>
          <Label>Progress</Label>
          {hasSteps ? (
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-trackbg px-3 py-2.5">
              <button
                onClick={() => set('progress', clamp((draft.progress ?? 0) - 1, 0, draft.total_steps ?? 0))}
                className="rounded-md border border-white/10 p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
                aria-label="Decrease progress"
              >
                <Minus size={13} />
              </button>
              <span className="font-mono text-sm text-zinc-200">
                {draft.progress ?? 0}
                <span className="text-zinc-600"> / </span>
                <input
                  type="number"
                  min={1}
                  value={draft.total_steps ?? 1}
                  onChange={(e) => {
                    const total = Math.max(1, Number(e.target.value) || 1);
                    setDraft((d) => ({ ...d, total_steps: total, progress: clamp(d.progress ?? 0, 0, total) }));
                  }}
                  className="w-12 rounded border border-white/10 bg-surface px-1 py-0.5 text-center font-mono text-sm text-zinc-300 outline-none focus:border-accent/60"
                  aria-label="Total steps"
                />
              </span>
              <button
                onClick={() => set('progress', clamp((draft.progress ?? 0) + 1, 0, draft.total_steps ?? 0))}
                className="rounded-md border border-white/10 p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
                aria-label="Increase progress"
              >
                <Plus size={13} />
              </button>
              <span className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-[width] duration-300"
                  style={{ width: `${((draft.progress ?? 0) / (draft.total_steps ?? 1)) * 100}%` }}
                />
              </span>
              <button
                onClick={() => setDraft((d) => ({ ...d, progress: null, total_steps: null }))}
                className="text-[11px] text-zinc-600 transition hover:text-alert"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDraft((d) => ({ ...d, progress: 0, total_steps: 5 }))}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] px-3 py-2 text-xs text-zinc-500 transition hover:border-accent/40 hover:text-zinc-300"
            >
              <ListChecks size={13} />
              Track steps
            </button>
          )}
        </div>

        {/* Resolution — help-desk style, shown when the task is (being) completed */}
        {completing && (
          <div className="animate-fade-in rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                <ClipboardCheck size={13} />
                Resolution
              </span>
              <span className="font-mono text-[10px] text-emerald-500/60">
                TICKET #{task.id.slice(0, 8).toUpperCase()} · RESOLVED{' '}
                {formatDateTime(task.completed_at ?? new Date().toISOString())}
              </span>
            </div>
            <TextArea
              rows={4}
              value={draft.completion_notes}
              onChange={(e) => set('completion_notes', e.target.value)}
              placeholder={'Root cause: …\nFix: …\nVerified: …'}
              className="border-emerald-500/20 bg-[#0d1512] font-mono text-[13px] text-emerald-100 placeholder:text-emerald-800 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            />
            <p className="mt-1.5 text-[11px] text-emerald-600/80">
              Write it like a ticket close-out — future-you (and interviewers) will read this.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label>
            Notes{task.notes.length > 0 ? ` (${task.notes.length})` : ''}
          </Label>
          <div className="space-y-2">
            {task.notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-white/[0.06] bg-trackbg px-3 py-2">
                <p className="text-[13px] leading-relaxed text-zinc-300">{note.content}</p>
                <span className="mt-1 block font-mono text-[10px] text-zinc-600">{formatDateTime(note.created_at)}</span>
              </div>
            ))}
            {task.notes.length === 0 && (
              <p className="flex items-center gap-1.5 px-1 text-xs text-zinc-600">
                <MessageSquare size={12} />
                No notes yet — log progress as you go.
              </p>
            )}
            <div className="flex gap-2">
              <TextInput
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNote();
                }}
                placeholder="Add a note…"
              />
              <Button variant="ghost" onClick={submitNote} disabled={!noteInput.trim()} aria-label="Add note" className="border border-white/[0.08]">
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
