import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TranslationKey } from '../../lib/i18n';
import { useLanguage } from '../../lib/i18n';
import {
  createBranchAccount,
  readPreviewBranchAccounts,
  type BranchAccount,
  type BranchAccountInput,
  type BranchAccountResult,
  type BranchField,
  type BranchFieldErrors,
} from '../../lib/mainOwnerApi';
import type { Language } from '../../types';

type MainOwnerView = 'overview' | 'branches' | 'wallets' | 'tickets' | 'revenue' | 'settings';
type Branch = BranchAccount;
type Translate = (key: TranslationKey) => string;

const navItems: { id: MainOwnerView; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { id: 'overview', labelKey: 'owner_main_nav_overview', icon: LayoutDashboard },
  { id: 'branches', labelKey: 'owner_main_nav_branches', icon: Building2 },
  { id: 'wallets', labelKey: 'owner_main_nav_wallets', icon: WalletCards },
  { id: 'tickets', labelKey: 'owner_main_nav_tickets', icon: CreditCard },
  { id: 'revenue', labelKey: 'owner_main_nav_revenue', icon: CircleDollarSign },
  { id: 'settings', labelKey: 'owner_main_nav_settings', icon: Settings },
];

const STATUS_LABELS: Record<string, TranslationKey> = {
  Active: 'owner_status_active',
  Pending: 'owner_status_pending',
  Suspended: 'owner_status_suspended',
};

const LEDGER_ROWS: { date: string; activity: TranslationKey; scope: string; amount: string; status: TranslationKey }[] = [
  { date: '2026-11-12', activity: 'owner_ledger_settlement', scope: 'Hlaing Tharyar Gate', amount: '+1,925,000 MMK', status: 'owner_ledger_available' },
  { date: '2026-11-11', activity: 'owner_ledger_branch_fee', scope: 'Aung Mingalar Gate', amount: '-10,000 MMK', status: 'owner_ledger_completed' },
  { date: '2026-11-10', activity: 'owner_ledger_commission', scope: 'Operator account', amount: '-245,000 MMK', status: 'owner_ledger_completed' },
  { date: '2026-11-09', activity: 'owner_ledger_sale', scope: 'Mandalay Station', amount: '+1,110,000 MMK', status: 'owner_status_pending' },
];

const ACTIVITY_ROWS: { title: TranslationKey; detail: string; time: string; tone: 'amber' | 'green' | 'cyan' }[] = [
  { title: 'owner_activity_fee', detail: 'Aung Mingalar Gate · 10,000 MMK', time: 'Today 09:20', tone: 'amber' },
  { title: 'owner_activity_settlement', detail: 'Hlaing Tharyar Gate · 1,925,000 MMK', time: 'Yesterday 17:45', tone: 'green' },
  { title: 'owner_activity_share', detail: 'Mandalay Station · 78%', time: 'Nov 08, 2026', tone: 'cyan' },
];

function formatAmount(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US').format(value);
}

function seedBranches(t: Translate, language: Language): Branch[] {
  const fee = `${formatAmount(10000, language)} MMK`;
  const dash = '—';
  return [
    { id: 'seed-1', station: 'Hlaing Tharyar Gate', city: 'Yangon', owner: 'Ko Min Htet', username: 'jj_hlaingtharyar', fee, share: '82%', sales: `${formatAmount(2840000, language)} MMK`, wallet: `${formatAmount(1925000, language)} MMK`, status: 'Active' },
    { id: 'seed-2', station: 'Aung Mingalar Gate', city: 'Yangon', owner: 'Daw Thandar', username: 'jj_aungmingalar', fee, share: '80%', sales: `${formatAmount(2410000, language)} MMK`, wallet: `${formatAmount(1650000, language)} MMK`, status: 'Active' },
    { id: 'seed-3', station: 'Mandalay Station', city: 'Mandalay', owner: 'U Zaw Lin', username: 'jj_mandalay', fee, share: '78%', sales: `${formatAmount(1780000, language)} MMK`, wallet: `${formatAmount(1110000, language)} MMK`, status: 'Active' },
    { id: 'seed-4', station: 'Naypyidaw Terminal', city: 'Naypyidaw', owner: t('owner_pending_invite'), username: 'jj_naypyidaw', fee, share: '80%', sales: dash, wallet: dash, status: 'Pending' },
  ];
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#244568] bg-[#0a203b] shadow-[0_12px_35px_rgba(0,0,0,0.16)] ${className}`}>{children}</section>;
}

function Heading({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1b3a5d] px-4 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base"><Icon size={19} className="text-[#28b9ff]" />{title}</h2>
      {action && <button type="button" onClick={onAction} className="text-[11px] font-bold text-cyan-300 hover:text-white">{action} <ChevronRight size={13} className="inline" /></button>}
    </div>
  );
}

export function MainOwnerPage() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const [view, setView] = useState<MainOwnerView>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState('');
  const [branches, setBranches] = useState<Branch[]>(() => [...seedBranches(t, language), ...readPreviewBranchAccounts()]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  }

  function selectView(next: MainOwnerView) {
    setView(next);
    setMobileOpen(false);
  }

  async function createBranch(input: BranchAccountInput): Promise<BranchAccountResult> {
    const result = await createBranchAccount(input);
    if (result.ok) {
      setBranches((current) => [result.branch, ...current]);
      setView('branches');
      notify(`${result.branch.station} · ${t('owner_branch_created')}`);
    }
    return result;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#06172b] text-[#dbeeff]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[#1a3c60] bg-gradient-to-b from-[#071e3a] to-[#041326] lg:flex">
          <div className="flex h-[74px] items-center gap-2 border-b border-white/10 px-5 text-xl font-extrabold tracking-tight text-[#28b9ff]"><span className="text-2xl">✈</span> MH Travel</div>
          <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-700 text-xl shadow-lg">JJ</div>
              <div><p className="text-sm font-bold text-white">JJ Express</p><p className="text-[10px] text-cyan-200">{t('owner_role_main')}</p></div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] font-bold text-green-300"><ShieldCheck size={11} /> {t('owner_verified_operator')}</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${view === item.id ? 'bg-gradient-to-r from-[#148bf3] to-[#176cd0] text-white shadow-lg shadow-blue-950/40' : 'text-blue-100/75 hover:bg-white/10 hover:text-white'}`}><Icon size={17} />{t(item.labelKey)}</button>
              );
            })}
          </nav>
          <button type="button" onClick={() => navigate('/admin/login')} className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-blue-500/10 px-3 py-3 text-xs font-bold text-white hover:bg-red-500/20"><LogOut size={16} /> {t('owner_exit_panel')}</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[74px] items-center justify-between gap-3 border-b border-[#1b3a5d] bg-[#071d37] px-4 text-white sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label={t('owner_open_menu')}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
              <span className="text-lg font-extrabold text-[#28b9ff] lg:hidden">✈ MH Travel</span>
              <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex"><span>{t('owner_operator')}</span><ChevronRight size={13} /><strong className="text-white">JJ Express</strong></div>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <button type="button" onClick={toggleLanguage} aria-label={t('owner_switch_language')} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20">
                <Globe2 size={14} />
                {language === 'mm' ? 'မြန်မာ' : 'English'}
              </button>
              <button type="button" onClick={() => notify(t('owner_no_notifications'))} className="relative rounded-full p-2 hover:bg-white/10" aria-label={t('owner_notifications')}><span className="text-lg">◉</span><span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold">4</span></button>
              <div className="flex items-center gap-2 border-l border-white/15 pl-3">
                <div className="hidden text-right sm:block"><p className="text-xs font-bold">U Kyaw Min</p><p className="text-[10px] text-cyan-200">{t('owner_role_main')} <ChevronDown size={11} className="inline" /></p></div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200 to-blue-700 text-xs font-bold">KM</div>
              </div>
            </div>
          </header>
          {mobileOpen && (
            <div className="border-b border-[#244568] bg-[#092442] p-3 lg:hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${view === item.id ? 'bg-[#147bea] text-white' : 'bg-[#102f50] text-blue-100'}`}><Icon size={15} />{t(item.labelKey)}</button>
                  );
                })}
              </div>
            </div>
          )}
          <main className="p-3 sm:p-5 lg:p-6">
            {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#0b3a71] px-4 py-3 text-xs text-white shadow-2xl">{notice}</div>}
            {view === 'overview'
              ? <Overview branches={branches} onCreate={() => setShowCreate(true)} onOpen={selectView} t={t} language={language} />
              : view === 'branches'
                ? <Branches branches={branches} onCreate={() => setShowCreate(true)} onNotify={notify} t={t} language={language} />
                : <OwnerSection view={view} branches={branches} onNotify={notify} t={t} language={language} />}
          </main>
          <footer className="border-t border-[#1b3a5d] bg-[#071d37] px-5 py-4 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between sm:text-left">
            <p><strong className="text-lg text-[#28b9ff]">MH Travel</strong><br />{t('owner_footer_main')}</p>
            <p>{t('owner_copyright')}</p>
            <p className="text-cyan-300">{t('owner_main_support')} · {t('owner_wallet_help')}</p>
          </footer>
        </div>
      </div>
      {showCreate && <CreateBranch onClose={() => setShowCreate(false)} onCreate={createBranch} t={t} />}
    </div>
  );
}

function Overview({ branches, onCreate, onOpen, t, language }: { branches: Branch[]; onCreate: () => void; onOpen: (view: MainOwnerView) => void; t: Translate; language: Language }) {
  return (
    <div className="mx-auto max-w-[1450px] space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0c3765] via-[#0a2748] to-[#07172c] p-5 shadow-xl sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{t('owner_main_control_center').toUpperCase()}</p>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-4xl">{t('owner_main_hero_title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-100/75 sm:text-sm">{t('owner_main_hero_intro')}</p>
          </div>
          <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#168df4] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-950/30 hover:bg-[#2aa6ff]"><UserPlus size={16} /> {t('owner_create_branch')}</button>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric icon={Building2} label={t('owner_active_branches')} value={formatAmount(branches.filter((branch) => branch.status === 'Active').length, language)} change="+2" tone="blue" />
        <Metric icon={Users} label={t('owner_branch_accounts')} value={formatAmount(branches.length, language)} change={`${formatAmount(10000, language)} MMK`} tone="cyan" />
        <Metric icon={CircleDollarSign} label={t('owner_ticket_sales')} value={`${formatAmount(7030000, language)} MMK`} change="↑ 18.7%" tone="green" />
        <Metric icon={WalletCards} label={t('owner_consolidated_wallet')} value={`${formatAmount(18450000, language)} MMK`} change={t('owner_available_balance')} tone="purple" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <WalletSummary onOpen={onOpen} t={t} language={language} />
        <BranchSnapshot branches={branches} onOpen={() => onOpen('branches')} t={t} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SalesChart onOpen={() => onOpen('tickets')} t={t} />
        <ActivityPanel t={t} />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, change, tone }: { icon: LucideIcon; label: string; value: string; change: string; tone: 'blue' | 'cyan' | 'green' | 'purple' }) {
  const colors = { blue: 'bg-blue-400/15 text-blue-300', cyan: 'bg-cyan-400/15 text-cyan-300', green: 'bg-green-400/15 text-green-300', purple: 'bg-purple-400/15 text-purple-300' };
  return (
    <article className="rounded-2xl border border-[#244568] bg-[#0a203b] p-4 shadow-lg">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon size={21} /></span>
      <p className="mt-3 text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-green-300">{change}</p>
    </article>
  );
}

function WalletSummary({ onOpen, t, language }: { onOpen: (view: MainOwnerView) => void; t: Translate; language: Language }) {
  return (
    <Panel>
      <Heading icon={WalletCards} title={t('owner_wallet_overview')} action={t('owner_open_wallets')} onAction={() => onOpen('wallets')} />
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <WalletCard label={t('owner_main_owner')} value={`${formatAmount(18450000, language)} MMK`} detail={t('owner_all_branches')} tone="cyan" />
        <WalletCard label={t('owner_branch_wallets')} value={`${formatAmount(6925000, language)} MMK`} detail={t('owner_three_stations')} tone="green" />
        <WalletCard label={t('owner_platform_ledger')} value={`${formatAmount(1245000, language)} MMK`} detail={t('owner_fees_commissions')} tone="purple" />
      </div>
      <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-[#244568] bg-[#071a31] px-3 py-2.5 text-[10px]">
        <span className="text-slate-400">{t('owner_next_settlement')} · 20 Nov 2026</span>
        <span className="font-bold text-cyan-300">{formatAmount(3840000, language)} MMK {t('owner_pending_amount')}</span>
      </div>
    </Panel>
  );
}

function WalletCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'cyan' | 'green' | 'purple' }) {
  const color = tone === 'cyan' ? 'text-cyan-300' : tone === 'green' ? 'text-green-300' : 'text-purple-300';
  return (
    <div className="rounded-xl border border-[#244568] bg-[#071a31] p-3">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-extrabold ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

function BranchSnapshot({ branches, onOpen, t }: { branches: Branch[]; onOpen: () => void; t: Translate }) {
  return (
    <Panel>
      <Heading icon={Building2} title={t('owner_branch_snapshot')} action={t('owner_manage_branches')} onAction={onOpen} />
      <div className="space-y-3 p-4">
        {branches.slice(0, 3).map((branch) => (
          <div key={branch.id} className="flex items-center gap-3 border-b border-[#1b3a5d] pb-3 last:border-0 last:pb-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-300">{branch.city.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{branch.station}</p>
              <p className="text-[10px] text-slate-500">{branch.owner} · {branch.share}</p>
            </div>
            <strong className="text-xs text-green-300">{branch.wallet}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SalesChart({ onOpen, t }: { onOpen: () => void; t: Translate }) {
  return (
    <Panel>
      <Heading icon={CreditCard} title={t('owner_sales_performance')} action={t('owner_view_sales')} onAction={onOpen} />
      <div className="h-[225px] p-4">
        <svg viewBox="0 0 700 200" preserveAspectRatio="none" className="h-full w-full">
          <g stroke="#244568" strokeDasharray="3 4"><line x1="28" y1="25" x2="680" y2="25" /><line x1="28" y1="75" x2="680" y2="75" /><line x1="28" y1="125" x2="680" y2="125" /><line x1="28" y1="175" x2="680" y2="175" /></g>
          <path d="M28 150 C90 138 108 145 148 110 S218 140 260 95 S328 126 370 70 S445 112 492 62 S570 94 612 47 S655 72 680 28 L680 175 L28 175 Z" fill="#28b9ff" fillOpacity=".12" />
          <path d="M28 150 C90 138 108 145 148 110 S218 140 260 95 S328 126 370 70 S445 112 492 62 S570 94 612 47 S655 72 680 28" fill="none" stroke="#28b9ff" strokeWidth="3" />
          <g fill="#28b9ff"><circle cx="28" cy="150" r="4" /><circle cx="148" cy="110" r="4" /><circle cx="260" cy="95" r="4" /><circle cx="370" cy="70" r="4" /><circle cx="492" cy="62" r="4" /><circle cx="612" cy="47" r="4" /><circle cx="680" cy="28" r="5" /></g>
        </svg>
        <div className="mt-1 flex justify-between px-2 text-[10px] text-slate-500"><span>Oct 1</span><span>Oct 7</span><span>Oct 14</span><span>Oct 21</span><span>Oct 31</span></div>
      </div>
    </Panel>
  );
}

function ActivityPanel({ t }: { t: Translate }) {
  return (
    <Panel>
      <Heading icon={ShieldCheck} title={t('owner_wallet_activity')} />
      <div className="divide-y divide-[#1b3a5d]">
        {ACTIVITY_ROWS.map((row) => (
          <div key={row.title} className="flex gap-3 p-4">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${row.tone === 'green' ? 'bg-green-400' : row.tone === 'amber' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <div>
              <p className="text-xs font-semibold text-white">{t(row.title)}</p>
              <p className="mt-1 text-[10px] text-slate-400">{row.detail}</p>
              <p className="mt-1 text-[10px] text-slate-600">{row.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Branches({ branches, onCreate, onNotify, t, language }: { branches: Branch[]; onCreate: () => void; onNotify: (message: string) => void; t: Translate; language: Language }) {
  const active = branches.filter((branch) => branch.status === 'Active').length;
  const pending = branches.filter((branch) => branch.status === 'Pending').length;
  return (
    <div className="mx-auto max-w-[1450px] space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{t('owner_operator_access')}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">{t('owner_branch_accounts')}</h1>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#168df4] px-4 py-3 text-xs font-bold text-white hover:bg-[#2aa6ff]"><Plus size={16} /> {t('owner_create_branch')}</button>
      </div>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b3a5d] px-4 py-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-green-400/15 px-2 py-1 text-green-300">{formatAmount(active, language)} {t('owner_active')}</span>
            <span className="rounded-full bg-amber-400/15 px-2 py-1 text-amber-300">{formatAmount(pending, language)} {t('owner_pending')}</span>
            <span>{formatAmount(10000, language)} MMK</span>
          </div>
          <button type="button" onClick={() => onNotify(t('owner_branch_export_ready'))} className="text-[11px] font-bold text-cyan-300">{t('owner_export_report')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[11px]">
            <thead className="bg-[#071a31] text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('owner_station_branch')}</th>
                <th className="px-2 py-3">{t('owner_branch_owner')}</th>
                <th className="px-2 py-3">{t('owner_account_fee')}</th>
                <th className="px-2 py-3">{t('owner_revenue_share')}</th>
                <th className="px-2 py-3">{t('owner_ticket_sales')}</th>
                <th className="px-2 py-3">{t('owner_wallet')}</th>
                <th className="px-2 py-3">{t('owner_status')}</th>
                <th className="px-4 py-3">{t('owner_action')}</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-t border-[#1b3a5d] text-slate-200">
                  <td className="px-4 py-3"><p className="font-bold text-white">{branch.station}</p><p className="mt-1 text-[10px] text-slate-500">{branch.city} · {branch.username}</p></td>
                  <td className="px-2 py-3">{branch.owner}</td>
                  <td className="px-2 py-3 text-amber-300">{branch.fee}</td>
                  <td className="px-2 py-3 text-cyan-300">{branch.share}</td>
                  <td className="px-2 py-3">{branch.sales}</td>
                  <td className="px-2 py-3 font-semibold text-green-300">{branch.wallet}</td>
                  <td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${branch.status === 'Active' ? 'bg-green-400/15 text-green-300' : branch.status === 'Pending' ? 'bg-amber-400/15 text-amber-300' : 'bg-red-400/15 text-red-300'}`}>{t(STATUS_LABELS[branch.status])}</span></td>
                  <td className="px-4 py-3"><button type="button" onClick={() => onNotify(`${branch.station} · ${t('owner_branch_manage_opened')}`)} className="rounded-md border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10">{t('owner_manage')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function OwnerSection({ view, branches, onNotify, t, language }: { view: Exclude<MainOwnerView, 'overview' | 'branches'>; branches: Branch[]; onNotify: (message: string) => void; t: Translate; language: Language }) {
  const item = navItems.find((nav) => nav.id === view) ?? navItems[2];
  const Icon = item.icon;
  const label = t(item.labelKey);
  const isWallet = view === 'wallets';
  return (
    <div className="mx-auto max-w-[1450px] space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{t('owner_main_controls')}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">{label}</h1>
      </div>
      <Panel>
        <Heading icon={Icon} title={label} action={isWallet ? t('owner_withdraw_request') : t('owner_add_new')} onAction={() => onNotify(isWallet ? t('owner_withdraw_opened') : `${t('owner_add_new')} · ${label}`)} />
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <WalletCard label={t('owner_main_owner')} value={`${formatAmount(18450000, language)} MMK`} detail={t('owner_all_branches')} tone="cyan" />
          <WalletCard label={t('owner_branch_wallets')} value={`${formatAmount(6925000, language)} MMK`} detail={`${formatAmount(branches.length, language)}`} tone="green" />
          <WalletCard label={t('owner_platform_ledger')} value={`${formatAmount(1245000, language)} MMK`} detail={t('owner_fees_commissions')} tone="purple" />
        </div>
        <div className="m-4 overflow-x-auto rounded-xl border border-[#244568]">
          <table className="w-full min-w-[720px] text-left text-[11px]">
            <thead className="bg-[#071a31] text-slate-400">
              <tr><th className="px-4 py-3">{t('owner_date')}</th><th className="px-2 py-3">{t('owner_activity')}</th><th className="px-2 py-3">{t('owner_scope')}</th><th className="px-2 py-3">{t('owner_amount')}</th><th className="px-4 py-3">{t('owner_status')}</th></tr>
            </thead>
            <tbody>
              {LEDGER_ROWS.map((row) => (
                <tr key={`${row.date}-${row.activity}`} className="border-t border-[#1b3a5d] text-slate-300">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-2 py-3 font-semibold text-white">{t(row.activity)}</td>
                  <td className="px-2 py-3">{row.scope}</td>
                  <td className={`px-2 py-3 font-bold ${row.amount.startsWith('+') ? 'text-green-300' : 'text-amber-300'}`}>{row.amount}</td>
                  <td className="px-4 py-3 text-cyan-300">{t(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CreateBranch({ onClose, onCreate, t }: { onClose: () => void; onCreate: (input: BranchAccountInput) => Promise<BranchAccountResult>; t: Translate }) {
  const [form, setForm] = useState<BranchAccountInput>({ station: '', city: 'Yangon', address: '', owner: '', username: '', phone: '', share: '80' });
  const [errors, setErrors] = useState<BranchFieldErrors>({});
  const [submitError, setSubmitError] = useState<TranslationKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(key: keyof BranchAccountInput, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await onCreate(form);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      setSubmitError(result.message);
      return;
    }
    onClose();
  }

  const fields: { key: BranchField; labelKey: TranslationKey; placeholder: string; required?: boolean }[] = [
    { key: 'station', labelKey: 'owner_station_name', placeholder: 'Hlaing Tharyar Gate', required: true },
    { key: 'city', labelKey: 'owner_city', placeholder: 'Yangon', required: true },
    { key: 'address', labelKey: 'owner_station_address', placeholder: 'Bayint Naung Road' },
    { key: 'owner', labelKey: 'owner_branch_owner_name', placeholder: 'Ko Min Htet' },
    { key: 'username', labelKey: 'owner_login_username', placeholder: 'jj_hlaingtharyar', required: true },
    { key: 'phone', labelKey: 'owner_phone', placeholder: '09 400 686 925', required: true },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-[#315c87] bg-[#091f3b] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#244568] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{t('owner_main_controls')}</p>
            <h2 className="mt-1 text-lg font-extrabold text-white">{t('owner_create_branch')}</h2>
            <p className="mt-1 text-[11px] text-slate-400">{t('owner_create_branch_intro')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={t('owner_cancel')}><X size={19} /></button>
        </div>
        <form onSubmit={submit} noValidate className="grid gap-3 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <Field key={field.key} label={t(field.labelKey)} value={form[field.key]} onChange={(value) => update(field.key, value)} placeholder={field.placeholder} required={field.required} error={errors[field.key] ? t(errors[field.key]!) : undefined} />
          ))}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-slate-400">{t('owner_monthly_fee')}</span>
            <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2.5 text-xs font-bold text-amber-200">10,000 MMK / month</div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-slate-400">{t('owner_branch_share')}</span>
            <div className={`flex items-center gap-2 rounded-lg border bg-[#071a31] px-3 py-2.5 ${errors.share ? 'border-red-400/70' : 'border-[#315c87]'}`}>
              <input type="number" min="0" max="100" step="0.01" value={form.share} onChange={(event) => update('share', event.target.value)} aria-invalid={Boolean(errors.share)} className="w-full bg-transparent text-xs text-white outline-none" />
              <span className="text-xs text-cyan-300">%</span>
            </div>
            {errors.share && <p className="mt-1 text-[10px] text-red-300">{t(errors.share)}</p>}
          </label>
          {submitError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200 sm:col-span-2">{t(submitError)}</div>}
          <div className="flex flex-col-reverse gap-2 border-t border-[#244568] pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-[#315c87] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50">{t('owner_cancel')}</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#168df4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2aa6ff] disabled:cursor-wait disabled:opacity-50"><Plus size={15} /> {isSubmitting ? t('owner_creating') : t('owner_create_pending_branch')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = false, error }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold text-slate-400">{label}{required && <span className="text-cyan-300"> *</span>}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} className={`w-full rounded-lg border bg-[#071a31] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-300 ${error ? 'border-red-400/70' : 'border-[#315c87]'}`} />
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </label>
  );
}
