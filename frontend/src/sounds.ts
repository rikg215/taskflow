/**
 * TaskFlow sound design — synthesized with the Web Audio API, no asset files.
 *
 *  · drop()          soft felt "thock" when a card lands in a column
 *  · taskComplete()  two-note chime, B5 → F#6 (a perfect fifth) — bright, brief, warm
 *  · trackComplete() rising C-major arpeggio over a low pad — the "shipped it" fanfare
 *
 * Every voice is a pair of slightly detuned sines through an exponential decay
 * envelope, which reads as a small glass marimba rather than a beep. Volumes
 * are deliberately low; these should feel like the UI breathing, not a slot
 * machine. Preference persists to localStorage and is toggled from the top bar.
 */

const STORAGE_KEY = 'taskflow.sound';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private _enabled: boolean;

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode etc. */
    }
    this._enabled = stored !== 'off';
  }

  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(value: boolean): void {
    this._enabled = value;
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
    } catch {
      /* ignore */
    }
  }

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** A soft, bell-like pluck: two detuned sines → exponential decay. */
  private pluck(
    ctx: AudioContext,
    freq: number,
    at: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
  ): void {
    const t0 = ctx.currentTime + at;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    env.connect(ctx.destination);
    for (const detune of [-3, 3]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(env);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
  }

  /** Muted felt thock — a card settling into a column. */
  drop(): void {
    if (!this._enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t0);
    osc.frequency.exponentialRampToValueAtTime(118, t0 + 0.09);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.075, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.18);
  }

  /** Task done — B5 then F#6, with a quiet lower octave for body. */
  taskComplete(): void {
    if (!this._enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.pluck(ctx, 987.77, 0, 0.55, 0.15); // B5
    this.pluck(ctx, 1479.98, 0.09, 0.9, 0.13); // F#6
    this.pluck(ctx, 493.88, 0, 0.5, 0.05); // B4 warmth
  }

  /** Track shipped — C-major arpeggio climbing to a shimmering high C. */
  trackComplete(): void {
    if (!this._enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.pluck(ctx, 130.81, 0, 1.5, 0.05, 'triangle'); // C3 pad underneath
    this.pluck(ctx, 523.25, 0.0, 0.5, 0.13); // C5
    this.pluck(ctx, 659.25, 0.1, 0.5, 0.13); // E5
    this.pluck(ctx, 783.99, 0.2, 0.6, 0.13); // G5
    this.pluck(ctx, 1046.5, 0.32, 1.25, 0.15); // C6 — the landing
    this.pluck(ctx, 1567.98, 0.32, 1.25, 0.05); // G6 shimmer on top
  }
}

export const sound = new SoundEngine();
