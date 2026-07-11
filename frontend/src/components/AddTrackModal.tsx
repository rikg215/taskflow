import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import type { NewTrackInput, TrackCategory } from '../types';
import { CATEGORY_META, CATEGORY_ORDER, cx } from '../utils';
import { Modal } from './Modal';
import { Button, fieldCls, Label, TextInput } from './ui';

interface AddTrackModalProps {
  onClose: () => void;
  onCreate: (input: NewTrackInput) => void;
}

export function AddTrackModal({ onClose, onCreate }: AddTrackModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TrackCategory>('project');
  const [priority, setPriority] = useState(5);
  const [targetDate, setTargetDate] = useState('');

  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onCreate({
      name: name.trim(),
      category,
      priority,
      target_date: targetDate || null,
    });
    onClose();
  };

  return (
    <Modal
      title="New track"
      icon={<FolderPlus size={14} className="text-accent" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Create track
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
            placeholder="e.g. AWS SAA-C03"
          />
        </label>

        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => {
              const meta = CATEGORY_META[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                    active ? 'border-transparent' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                  style={active ? { background: `${meta.color}22`, color: meta.color, borderColor: `${meta.color}55` } : undefined}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Priority</Label>
            <span className="font-mono text-xs text-zinc-400">P{priority}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full"
            aria-label="Priority"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
            <span>P1 · highest</span>
            <span>P10 · someday</span>
          </div>
        </div>

        <label className="block">
          <Label>Target date</Label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={cx(fieldCls, 'font-mono text-xs')}
          />
        </label>
      </div>
    </Modal>
  );
}
