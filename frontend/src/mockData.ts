import type { Task, Track } from './types';

// ————————————————————————————————————————————————————————————————
// Tracks — completion_percent === round(completed_count / task_count).
// The visible tasks below are a working subset; counts are authoritative.
// ————————————————————————————————————————————————————————————————

export const MOCK_TRACKS: Track[] = [
  { id: '1', name: 'CKA Course', category: 'cert', priority: 1, target_date: '2026-09-25', status: 'active', completion_percent: 62, task_count: 34, completed_count: 21 },
  { id: '2', name: 'Ansible Course', category: 'course', priority: 2, target_date: '2026-07-20', status: 'active', completion_percent: 24, task_count: 25, completed_count: 6 },
  { id: '3', name: 'Python for DevOps', category: 'course', priority: 3, target_date: null, status: 'active', completion_percent: 8, task_count: 24, completed_count: 2 },
  { id: '4', name: 'Ansible Fleet Project', category: 'project', priority: 2, target_date: '2026-07-20', status: 'active', completion_percent: 0, task_count: 12, completed_count: 0 },
  { id: '5', name: 'CI/CD Pipeline', category: 'project', priority: 3, target_date: '2026-07-27', status: 'active', completion_percent: 0, task_count: 10, completed_count: 0 },
  { id: '6', name: 'Hybrid Inference Gateway', category: 'side-quest', priority: 5, target_date: null, status: 'active', completion_percent: 0, task_count: 8, completed_count: 0 },
  { id: '7', name: 'Job Search', category: 'meta', priority: 1, target_date: null, status: 'active', completion_percent: 40, task_count: 5, completed_count: 2 },
  { id: '8', name: 'AWS 3-Tier Project', category: 'project', priority: 1, target_date: '2026-07-09', status: 'shipped', completion_percent: 100, task_count: 19, completed_count: 19 },
];

// ————————————————————————————————————————————————————————————————
// Tasks — 40 across all tracks and columns.
// Tip: all 5 Job Search tasks are on the board — finish the remaining
// three to watch a track hit 100% (pulse, checkmark, fanfare).
// ————————————————————————————————————————————————————————————————

const T = (t: Omit<Task, 'description' | 'progress' | 'total_steps' | 'scheduled_day' | 'completion_notes' | 'completed_at' | 'notes'> & Partial<Task>): Task => ({
  description: null,
  progress: null,
  total_steps: null,
  scheduled_day: null,
  completion_notes: null,
  completed_at: null,
  notes: [],
  ...t,
});

export const MOCK_TASKS: Task[] = [
  // ——— BACKLOG ———————————————————————————————————————————
  T({ id: 't07', track_id: '1', name: 'Network Policies + LAB', weight: 2, status: 'not-started', sort_order: 0, column_name: 'backlog', scheduled_day: '2026-07-15' }),
  T({ id: 't08', track_id: '1', name: 'kubeadm cluster upgrade drill', weight: 2, status: 'not-started', sort_order: 1, column_name: 'backlog', scheduled_day: '2026-07-17' }),
  T({ id: 't09', track_id: '1', name: 'ETCD backup & restore drill', weight: 2, status: 'not-started', sort_order: 2, column_name: 'backlog', scheduled_day: '2026-07-18' }),
  T({ id: 't10', track_id: '1', name: 'Mock Exam 1 (killer.sh)', weight: 5, status: 'not-started', sort_order: 3, column_name: 'backlog', scheduled_day: '2026-07-19' }),
  T({ id: 't14', track_id: '2', name: 'Handlers (02:23) + Roles (07:46)', weight: 2, status: 'not-started', sort_order: 4, column_name: 'backlog', scheduled_day: '2026-07-16' }),
  T({ id: 't15', track_id: '2', name: 'Templates + Jinja2 (09:12)', weight: 2, status: 'not-started', sort_order: 5, column_name: 'backlog', scheduled_day: '2026-07-21' }),
  T({ id: 't16', track_id: '2', name: 'Ansible Vault (04:48)', weight: 1, status: 'not-started', sort_order: 6, column_name: 'backlog', scheduled_day: '2026-07-22' }),
  T({ id: 't20', track_id: '3', name: 'requests + API polling script', weight: 2, status: 'not-started', sort_order: 7, column_name: 'backlog', scheduled_day: '2026-07-24' }),
  T({ id: 't21', track_id: '3', name: 'pytest fundamentals', weight: 2, status: 'not-started', sort_order: 8, column_name: 'backlog' }),
  T({ id: 't24', track_id: '4', name: 'Base role: users + SSH hardening', weight: 3, status: 'not-started', sort_order: 9, column_name: 'backlog', scheduled_day: '2026-07-19' }),
  T({ id: 't25', track_id: '4', name: 'Patch management playbook', weight: 2, status: 'not-started', sort_order: 10, column_name: 'backlog', scheduled_day: '2026-07-23' }),
  T({ id: 't26', track_id: '4', name: 'pfSense VLAN inventory groups', weight: 2, status: 'not-started', sort_order: 11, column_name: 'backlog', scheduled_day: '2026-07-26' }),
  T({ id: 't28', track_id: '5', name: 'Pipeline stages: lint → test → build', weight: 3, status: 'not-started', sort_order: 12, column_name: 'backlog', scheduled_day: '2026-07-28' }),
  T({ id: 't29', track_id: '5', name: 'Deploy stage → k8s (kubectl apply)', weight: 3, status: 'not-started', sort_order: 13, column_name: 'backlog', scheduled_day: '2026-07-30' }),
  T({ id: 't30', track_id: '5', name: 'Container registry (Harbor eval)', weight: 2, status: 'not-started', sort_order: 14, column_name: 'backlog' }),
  T({ id: 't31', track_id: '6', name: 'LiteLLM proxy spike', weight: 2, status: 'not-started', sort_order: 15, column_name: 'backlog' }),
  T({ id: 't32', track_id: '6', name: 'Route local Hermes ↔ OpenRouter fallback', weight: 3, status: 'blocked', sort_order: 16, column_name: 'backlog', description: 'Blocked on the provider allow-list — currently pinned to two providers.' }),
  T({ id: 't33', track_id: '6', name: 'Latency + cost benchmarks', weight: 2, status: 'not-started', sort_order: 17, column_name: 'backlog' }),

  // ——— TODO ——————————————————————————————————————————————
  T({ id: 't05', track_id: '1', name: 'DNS in k8s + CoreDNS + LAB', weight: 3, status: 'not-started', sort_order: 0, column_name: 'todo', scheduled_day: '2026-07-11', description: 'CoreDNS Corefile, stub domains, and the `cluster.local` search path. Break it, then fix it.' }),
  T({ id: 't06', track_id: '1', name: 'Ingress Controllers + LAB', weight: 3, status: 'not-started', sort_order: 1, column_name: 'todo', scheduled_day: '2026-07-12' }),
  T({ id: 't17', track_id: '2', name: 'Conditionals & Loops + LAB', weight: 2, status: 'not-started', sort_order: 2, column_name: 'todo', scheduled_day: '2026-07-12' }),
  T({ id: 't19', track_id: '3', name: 'Repo init + README manifesto', weight: 1, status: 'not-started', sort_order: 3, column_name: 'todo', scheduled_day: '2026-07-13' }),
  T({ id: 't22', track_id: '3', name: 'argparse CLI skeleton', weight: 2, status: 'not-started', sort_order: 4, column_name: 'todo', scheduled_day: '2026-07-15' }),
  T({ id: 't27', track_id: '4', name: 'Bootstrap playbook for ld + lh', weight: 3, status: 'not-started', sort_order: 5, column_name: 'todo', scheduled_day: '2026-07-14', description: 'Targets the Debian 12 + Ubuntu 20.04 VMs on the new VLAN. Remember the pfSense rule: **Any**, not TCP-only.' }),
  T({ id: 't35', track_id: '7', name: 'Apply: 5 cloud roles (Central PA)', weight: 3, status: 'not-started', sort_order: 6, column_name: 'todo', scheduled_day: '2026-07-10', description: 'Healthcare systems, insurance/finance, MSPs, higher ed. Tailor each cover note to the stack.' }),
  T({ id: 't36', track_id: '7', name: 'LinkedIn overhaul + banner', weight: 2, status: 'not-started', sort_order: 7, column_name: 'todo', scheduled_day: '2026-07-11' }),

  // ——— IN PROGRESS ———————————————————————————————————————
  T({
    id: 't04', track_id: '1', name: 'Service Networking (08:51) + LAB', weight: 3, status: 'in-progress', sort_order: 0, column_name: 'in-progress',
    progress: 3, total_steps: 5, scheduled_day: '2026-07-10',
    description: 'Covers **kube-proxy** modes and `ClusterIP` / `NodePort` plumbing.\n- Watch section (08:51)\n- Rebuild the LAB from scratch\n- Trace the iptables chains with `iptables -t nat -L`',
    notes: [{ id: 'n2', task_id: 't04', content: 'kube-proxy iptables mode — traced a ClusterIP chain end to end. NodePort next.', created_at: '2026-07-10T09:15:00Z' }],
  }),
  T({ id: 't18', track_id: '2', name: 'Inventory patterns (04:37) + LAB', weight: 2, status: 'in-progress', sort_order: 1, column_name: 'in-progress', progress: 1, total_steps: 3 }),
  T({
    id: 't34', track_id: '7', name: 'Resume v2 — projects section', weight: 2, status: 'in-progress', sort_order: 2, column_name: 'in-progress',
    progress: 2, total_steps: 4, scheduled_day: '2026-07-08',
    notes: [{ id: 'n3', task_id: 't34', content: 'Lead with tf-aws-3tier v1.0 — quantify the 502 fix and the NAT GW ordering work.', created_at: '2026-07-07T21:30:00Z' }],
  }),

  // ——— DONE ——————————————————————————————————————————————
  T({
    id: 't01', track_id: '1', name: 'Network Namespaces + LAB', weight: 3, status: 'complete', sort_order: 0, column_name: 'done',
    completed_at: '2026-07-09T21:14:00Z',
    completion_notes: 'Built a veth pair between two netns, bridged them, verified reachability with ping + tcpdump. Wrote the flow up in Obsidian for CKA review.',
    notes: [{ id: 'n1', task_id: 't01', content: 'Rebuilt the veth-pair lab from scratch without the guide.', created_at: '2026-07-09T20:02:00Z' }],
  }),
  T({ id: 't02', track_id: '1', name: 'Docker Networking deep-dive', weight: 2, status: 'complete', sort_order: 1, column_name: 'done', completed_at: '2026-07-08T19:40:00Z' }),
  T({ id: 't03', track_id: '1', name: 'CNI concepts (07:14)', weight: 1, status: 'complete', sort_order: 2, column_name: 'done', completed_at: '2026-07-07T18:05:00Z' }),
  T({ id: 't11', track_id: '2', name: 'Playbook anatomy (06:02)', weight: 1, status: 'complete', sort_order: 3, column_name: 'done', completed_at: '2026-07-05T16:20:00Z' }),
  T({ id: 't12', track_id: '2', name: 'Ad-hoc commands + LAB', weight: 1, status: 'complete', sort_order: 4, column_name: 'done', completed_at: '2026-07-04T15:00:00Z' }),
  T({ id: 't13', track_id: '3', name: 'Env setup: pyenv + venv + ruff', weight: 1, status: 'complete', sort_order: 5, column_name: 'done', completed_at: '2026-07-03T20:30:00Z' }),
  T({
    id: 't37', track_id: '7', name: 'GitHub profile README', weight: 1, status: 'complete', sort_order: 6, column_name: 'done',
    completed_at: '2026-07-02T22:10:00Z',
    completion_notes: 'Pinned tf-aws-3tier, added Terraform Associate + LFCS badges, wrote a short now/next section.',
  }),
  T({ id: 't38', track_id: '7', name: 'Resume v1 baseline', weight: 2, status: 'complete', sort_order: 7, column_name: 'done', completed_at: '2026-06-28T17:45:00Z' }),
  T({
    id: 't23', track_id: '8', name: 'NAT gateway race condition fix', weight: 5, status: 'complete', sort_order: 8, column_name: 'done',
    completed_at: '2026-07-08T23:55:00Z',
    completion_notes:
      'Root cause: ASG instances came up before NAT GW routes propagated → app tier had no egress → ALB returned 502s.\nFix: explicit depends_on on route-table associations + create_before_destroy on the NAT GW; added a health-check wait.\nVerified: 3× clean apply/destroy cycles, zero 502s under a 5-minute curl loop.',
    notes: [{ id: 'n4', task_id: 't23', content: 'Reproduced reliably by tearing the NAT GW down first — ALB health checks flap within ~40s.', created_at: '2026-07-08T18:22:00Z' }],
  }),
  T({ id: 't39', track_id: '8', name: 'v1.0 tag + release notes', weight: 2, status: 'complete', sort_order: 9, column_name: 'done', completed_at: '2026-07-09T20:15:00Z' }),
  T({ id: 't40', track_id: '8', name: 'Architecture diagram + README polish', weight: 2, status: 'complete', sort_order: 10, column_name: 'done', completed_at: '2026-07-09T21:40:00Z' }),
  // ——— HISTORY (v2.1 demo data: past 8 weeks of timestamped completions) ———
  T({ id: 'h01', track_id: '1', name: 'Pods & ReplicaSets drill', weight: 1, status: 'complete', sort_order: 20, column_name: 'done', completed_at: '2026-05-19T20:10:00Z' }),
  T({ id: 'h02', track_id: '1', name: 'Deployments + rollouts LAB', weight: 2, status: 'complete', sort_order: 21, column_name: 'done', completed_at: '2026-05-26T19:05:00Z' }),
  T({ id: 'h03', track_id: '1', name: 'ConfigMaps & Secrets LAB', weight: 1, status: 'complete', sort_order: 22, column_name: 'done', completed_at: '2026-06-02T21:00:00Z' }),
  T({ id: 'h04', track_id: '1', name: 'Scheduling: taints + affinity', weight: 2, status: 'complete', sort_order: 23, column_name: 'done', completed_at: '2026-06-09T18:45:00Z' }),
  T({ id: 'h05', track_id: '1', name: 'Static pods + kubelet debug', weight: 2, status: 'complete', sort_order: 24, column_name: 'done', completed_at: '2026-06-16T22:20:00Z' }),
  T({ id: 'h06', track_id: '1', name: 'Deployment vs RS adoption', weight: 1, status: 'complete', sort_order: 25, column_name: 'done', completed_at: '2026-06-21T17:30:00Z' }),
  T({ id: 'h07', track_id: '1', name: 'kubectl manifest generation', weight: 1, status: 'complete', sort_order: 26, column_name: 'done', completed_at: '2026-06-27T20:55:00Z' }),
  T({ id: 'h08', track_id: '1', name: 'Storage: PV/PVC + NFS CSI', weight: 2, status: 'complete', sort_order: 27, column_name: 'done', completed_at: '2026-07-01T19:15:00Z' }),
  T({ id: 'h09', track_id: '2', name: 'Install + inventory basics', weight: 1, status: 'complete', sort_order: 28, column_name: 'done', completed_at: '2026-06-12T16:40:00Z' }),
  T({ id: 'h10', track_id: '2', name: 'First playbook on Proxmox lab', weight: 2, status: 'complete', sort_order: 29, column_name: 'done', completed_at: '2026-06-24T21:10:00Z' }),
  T({ id: 'h11', track_id: '2', name: 'Modules survey (05:11)', weight: 1, status: 'complete', sort_order: 30, column_name: 'done', completed_at: '2026-06-30T18:00:00Z' }),
  T({ id: 'h12', track_id: '3', name: 'Python refresher: dicts + comprehensions', weight: 1, status: 'complete', sort_order: 31, column_name: 'done', completed_at: '2026-06-25T20:30:00Z' }),
];
