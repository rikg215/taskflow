import { useState } from 'react';
import { CirclePlus, Plus, X } from 'lucide-react';
import type { ColumnName, NewTaskInput, Track } from '../types';
import { COLUMNS, cx } from '../utils';
import { Modal } from './Modal';
import { Button, fieldCls, Label, Select, TextArea, TextInput } from './ui';

interface AddTaskModalProps {
  tracks: Track[];
  defaultTrackId: string | null;
  onClose: () => void;
  onCreate: (inputs: NewTaskInput[]) => void;
}

export function AddTaskModal({ tracks, defaultTrackId, onClose, onCreate }: AddTaskModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trackId, setTrackId] = useState(defaultTrackId ?? tracks[0]?.id ?? '');
  const [weight, setWeight] = useState(1);
  const [column, setColumn] = useState<ColumnName>('backlog');
  const [day, setDay] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const setSubtask = (i: number, value: string) => setSubtasks((s) => s.map((v, j) => (j === i ? value : v)));
  const removeSubtask = (i: number) => setSubtasks((s) => s.filter((_, j) => j !== i));

  const valid = name.trim().length > 0 && trackId !== '';

  const submit = () => {
    if (!valid) return;
    const base: NewTaskInput = {
      name: name.trim(),
      description: description.trim() || null,
      track_id: trackId,
      weight,
      column_name: column,
      scheduled_day: day || null,
    };
    const subs: NewTaskInput[] = subtasks
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({
        name: s,
        description: null,
        track_id: trackId,
        weight: 1,
        column_name: column,
        scheduled_day: null,
      }));
    onCreate([base, ...subs]);
    onClose();
  };

  return (
    <Modal
      title="Add task"
      icon={<CirclePlus size={14} className="text-accent" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Add {subtasks.filter((s) => s.trim()).length > 0 ? `${1 + subtasks.filter((s) => s.trim()).length} tasks` : 'task'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <Label>Name *</Label>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="e.g. Service Networking (08:51) + LAB"
          />
        </label>

        <label className="block">
          <Label>Description</Label>
          <TextArea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — markdown supported"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <Label>Track</Label>
            <Select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Column</Label>
            <Select value={column} onChange={(e) => setColumn(e.target.value as ColumnName)}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Scheduled day</Label>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={cx(fieldCls, 'font-mono text-xs')} />
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Weight</Label>
            <span className="font-mono text-xs text-zinc-400">{weight}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full"
            aria-label="Weight"
          />
        </div>

        {/* Subtasks */}
        <div>
          <Label>Subtasks</Label>
          <div className="space-y-2">
            {subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                <TextInput
                  value={s}
                  autoFocus={i === subtasks.length - 1 && s === ''}
                  onChange={(e) => setSubtask(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && s.trim()) setSubtasks((prev) => [...prev, '']);
                  }}
                  placeholder="Subtask name"
                />
                <button
                  onClick={() => removeSubtask(i)}
                  className="rounded-md p-1.5 text-zinc-600 transition hover:bg-white/5 hover:text-alert"
                  aria-label="Remove subtask"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setSubtasks((s) => [...s, ''])}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] px-3 py-1.5 text-xs text-zinc-500 transition hover:border-accent/40 hover:text-zinc-300"
            >
              <Plus size={12} />
              Add subtask
            </button>
            <p className="text-[11px] text-zinc-600">Subtasks are created as sibling cards in the same track and column.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
