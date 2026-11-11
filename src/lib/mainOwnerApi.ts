import { isSupabaseConfigured, supabase } from './supabase';

export type BranchStatus = 'Active' | 'Pending' | 'Suspended';

export type BranchAccount = {
  id: string;
  station: string;
  city: string;
  owner: string;
  username: string;
  fee: string;
  share: string;
  sales: string;
  wallet: string;
  status: BranchStatus;
};

export type BranchAccountInput = {
  station: string;
  city: string;
  address: string;
  owner: string;
  username: string;
  phone: string;
  share: string;
};

export type BranchField = keyof BranchAccountInput;
export type BranchFieldErrors = Partial<Record<BranchField, string>>;
export type BranchAccountResult =
  | { ok: true; branch: BranchAccount; source: 'supabase' | 'preview' }
  | { ok: false; message: string; errors?: BranchFieldErrors };

const PREVIEW_BRANCHES_KEY = 'mh-main-owner-branch-accounts';
const MONTHLY_BRANCH_FEE_MMK = 10000;

function trimInput(input: BranchAccountInput): BranchAccountInput {
  return {
    station: input.station.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    owner: input.owner.trim(),
    username: input.username.trim().toLowerCase(),
    phone: input.phone.trim(),
    share: input.share.trim(),
  };
}

export function validateBranchAccount(rawInput: BranchAccountInput): BranchFieldErrors {
  const input = trimInput(rawInput);
  const errors: BranchFieldErrors = {};
  const namePattern = /^[\p{L}\p{N}][\p{L}\p{N} .,'()&/-]{1,79}$/u;
  const usernamePattern = /^[a-z][a-z0-9_]{3,31}$/;
  const phoneDigits = input.phone.replace(/[\s-]/g, '');
  const phonePattern = /^(?:09\d{7,9}|\+?959\d{7,9})$/;
  const share = Number(input.share);

  if (!namePattern.test(input.station)) errors.station = 'Use 2–80 letters or numbers and avoid special symbols.';
  if (!input.city || input.city.length < 2 || input.city.length > 60) errors.city = 'Enter a city between 2 and 60 characters.';
  if (input.address.length > 160) errors.address = 'Address must be 160 characters or fewer.';
  if (input.owner && (input.owner.length < 2 || input.owner.length > 80)) errors.owner = 'Owner name must be 2–80 characters.';
  if (!usernamePattern.test(input.username)) errors.username = 'Use 4–32 lowercase letters, numbers, or underscores; start with a letter.';
  if (!phonePattern.test(phoneDigits)) errors.phone = 'Enter a valid Myanmar phone number, for example 09 400 686 925.';
  if (!Number.isFinite(share) || share < 0 || share > 100) errors.share = 'Revenue share must be between 0 and 100%.';

  return errors;
}

function toBranchAccount(row: Record<string, unknown>, fallback: BranchAccountInput): BranchAccount {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    station: String(row.station_name ?? fallback.station),
    city: String(row.city ?? fallback.city),
    owner: String(row.owner_name ?? fallback.owner ?? 'Pending invite'),
    username: String(row.username ?? fallback.username),
    fee: `${Number(row.monthly_fee_mmk ?? MONTHLY_BRANCH_FEE_MMK).toLocaleString()} MMK`,
    share: `${Number(row.revenue_share_percent ?? fallback.share).toString()}%`,
    sales: '—',
    wallet: '—',
    status: (row.status === 'active' || row.status === 'suspended' ? (row.status[0].toUpperCase() + row.status.slice(1)) : 'Pending') as BranchStatus,
  };
}

export function readPreviewBranchAccounts(): BranchAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(PREVIEW_BRANCHES_KEY);
    return stored ? (JSON.parse(stored) as BranchAccount[]) : [];
  } catch {
    return [];
  }
}

function savePreviewBranch(branch: BranchAccount) {
  const current = readPreviewBranchAccounts();
  window.localStorage.setItem(PREVIEW_BRANCHES_KEY, JSON.stringify([branch, ...current]));
}

export async function createBranchAccount(rawInput: BranchAccountInput): Promise<BranchAccountResult> {
  const input = trimInput(rawInput);
  const errors = validateBranchAccount(input);
  if (Object.keys(errors).length > 0) return { ok: false, message: 'Please fix the highlighted fields.', errors };

  const duplicatePreview = readPreviewBranchAccounts().some((branch) => branch.username === input.username);
  if (duplicatePreview) return { ok: false, message: 'This username is already used by a preview branch account.', errors: { username: 'Choose a unique username.' } };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('operator_branches').insert({
      operator_id: 'jj-express-demo',
      station_name: input.station,
      city: input.city,
      address: input.address || null,
      owner_name: input.owner || null,
      username: input.username,
      phone: input.phone.replace(/[\s-]/g, ''),
      monthly_fee_mmk: MONTHLY_BRANCH_FEE_MMK,
      revenue_share_percent: Number(input.share),
      status: 'pending',
    }).select('id, station_name, city, owner_name, username, monthly_fee_mmk, revenue_share_percent, status').single();

    if (error) return { ok: false, message: error.code === '42P01' ? 'Branch API is not ready: create the operator_branches table and RLS policy first.' : error.message };
    return { ok: true, branch: toBranchAccount(data as Record<string, unknown>, input), source: 'supabase' };
  }

  const branch = toBranchAccount({ id: `preview-${Date.now()}`, ...input, monthly_fee_mmk: MONTHLY_BRANCH_FEE_MMK, revenue_share_percent: Number(input.share), status: 'pending' }, input);
  savePreviewBranch(branch);
  return { ok: true, branch, source: 'preview' };
}
