/**
 * Plan §3A.2 rule 6: one set of tokens for the dashboard, so a button or a
 * status colour is not re-invented per panel. Kept out of `SectionShell.tsx`
 * because a module that exports both components and constants cannot hot
 * reload (react-refresh).
 */

export const STATUS_TONES: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  visible: 'bg-emerald-500/20 text-emerald-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  completed: 'bg-purple-500/20 text-purple-300',
  booked: 'bg-purple-500/20 text-purple-300',
  accepted: 'bg-blue-500/20 text-blue-300',
  open: 'bg-blue-500/20 text-blue-300',
  quoted: 'bg-blue-500/20 text-blue-300',
  contacted: 'bg-cyan-500/20 text-cyan-300',
  requested: 'bg-amber-500/20 text-amber-200',
  new: 'bg-amber-500/20 text-amber-200',
  pending: 'bg-amber-500/20 text-amber-200',
  pending_invite: 'bg-amber-500/20 text-amber-200',
  suspended: 'bg-orange-500/20 text-orange-200',
  hidden: 'bg-orange-500/20 text-orange-200',
  expired: 'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-red-500/20 text-red-300',
  deleted: 'bg-red-500/20 text-red-300',
  removed: 'bg-red-500/20 text-red-300',
  closed: 'bg-slate-500/20 text-slate-300',
};

export function statusTone(status: string): string {
  return STATUS_TONES[status] ?? 'bg-slate-500/20 text-slate-300';
}

export const INPUT_CLASS =
  'w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300';

export const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-[#2b527d] bg-[#102c51] px-2 py-1.5 text-[11px] text-white outline-none';

export const PRIMARY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md bg-[#168df4] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#2aa6ff] disabled:opacity-40';

export const GHOST_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md border border-[#2b527d] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400 hover:text-white disabled:opacity-40';

export const DANGER_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md border border-red-400/50 px-2.5 py-1.5 text-[11px] font-semibold text-red-200 hover:bg-red-500/15';
