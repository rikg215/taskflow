# TaskFlow

Personal mission control — a dark-mode kanban + health-bar dashboard for study tracks, projects, and career goals. React 18 + TypeScript + Vite + Tailwind, drag-and-drop via `@hello-pangea/dnd`, animation via Framer Motion.

## Quickstart

```bash
npm install
npm run dev        # http://localhost:5173 — runs on mock data out of the box
npm run build      # type-check + production bundle → dist/
```

No env vars needed for the mock mode. The sidebar footer shows `MOCK DATA` so you always know which world you're in.

## Connecting the FastAPI backend

Set `VITE_API_URL` and rebuild (or restart dev):

```bash
# same-origin (nginx/Ingress serving the SPA and proxying /api to FastAPI)
VITE_API_URL=/ npm run build

# absolute base
VITE_API_URL=http://taskflow.home npm run dev
```

For local dev against a backend on another port, uncomment the proxy block in `vite.config.ts` instead and keep `VITE_API_URL=/`.

### API contract used

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/tracks` | |
| GET | `/api/tasks?track_id=X` | `track_id` optional |
| POST | `/api/tasks` | |
| PUT | `/api/tasks/{id}` | generic patch |
| PUT | `/api/tasks/{id}/complete` | body: `{ completion_notes }` |
| PUT | `/api/tasks/{id}/move` | body: `{ column_name, sort_order }` |
| GET | `/api/dashboard` | |

Extensions the UI also calls (add these to the backend or stub them — mock mode implements them fully): `POST /api/tracks`, `DELETE /api/tasks/{id}`, and notes are appended via `PUT /api/tasks/{id}` with `{ append_note }` (swap `api.addNote` in `src/api.ts` if you build a dedicated notes endpoint).

All writes are optimistic: the UI updates instantly and persists in the background, so it stays snappy on the homelab even if the API pod is having a day.

## Sound design

Completion sounds are synthesized live with the Web Audio API — no audio assets:

- **Card drop** — a muted felt "thock" (pitch-falling triangle wave).
- **Task complete** — a two-note chime, B5 → F#6, with a quiet lower octave for warmth.
- **Track shipped** — a rising C-major arpeggio landing on a shimmering high C over a low pad, played ~0.4s after the task chime.

Each voice is a pair of slightly detuned sines through an exponential-decay envelope, so it reads as a small glass marimba rather than a beep. Toggle with the speaker icon in the top bar (persists to `localStorage`).

## Try the 100% celebration

The **Job Search** track has all 5 of its tasks on the board with 2 already done. Drag the remaining three into **Done** — on the last one the health bar pulses, a checkmark springs in, the fanfare plays, and the track moves to **Shipped** with a trophy.

## Notes

- Filtering by track (sidebar checkboxes) dims non-matching cards to 30% instead of removing them, so board shape stays readable.
- Dragging a card into **Done** auto-completes it; dragging it back out reopens it as in-progress.
- `completion_percent` is derived as `round(completed_count / task_count × 100)`, matching the backend.
- Respects `prefers-reduced-motion`.
