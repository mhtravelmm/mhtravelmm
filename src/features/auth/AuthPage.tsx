import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { DEMO_SUPER_ADMIN_HINT, useAuth } from '../../lib/auth';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const { t } = useLanguage();
  const { login, signup, isAuthenticated, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(location.pathname === '/signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(isSuperAdmin ? '/super-admin' : '/account', { replace: true });
  }, [isAuthenticated, isSuperAdmin, navigate]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    navigate(next === 'signup' ? '/signup' : '/login', { replace: true });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = mode === 'login'
      ? await login(email, password)
      : await signup({ name, email, password, phone });
    setBusy(false);
    if (!result.ok) {
      setError(result.message ? t(result.message as never) : t('auth_generic_error'));
      return;
    }
  }

  function fillDemoAdmin() {
    setEmail(DEMO_SUPER_ADMIN_HINT.email);
    setPassword(DEMO_SUPER_ADMIN_HINT.password);
    setMode('login');
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-170px)] max-w-6xl items-center justify-center py-8">
      <section className="grid w-full overflow-hidden rounded-card border border-border bg-bg-card lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blueDark via-bg-card to-bg-cardAlt p-8 lg:block">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div><p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-blue">MH Travel</p><h1 className="mt-5 max-w-sm text-3xl font-medium leading-tight text-white">{t('auth_hero_title')}</h1><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/70">{t('auth_hero_intro')}</p></div>
            <div className="rounded-lg border border-white/10 bg-black/15 p-4"><div className="flex items-center gap-2 text-sm text-white"><ShieldCheck size={16} className="text-brand-blue" />{t('auth_secure_note')}</div><p className="mt-2 text-xs leading-5 text-blue-100/60">{t('auth_secure_detail')}</p></div>
          </div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex rounded-lg bg-bg-cardAlt p-1"><button type="button" onClick={() => switchMode('login')} className={`flex-1 rounded-md py-2 text-xs transition ${mode === 'login' ? 'bg-brand-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>{t('auth_login')}</button><button type="button" onClick={() => switchMode('signup')} className={`flex-1 rounded-md py-2 text-xs transition ${mode === 'signup' ? 'bg-brand-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>{t('auth_signup')}</button></div>
          <div className="mb-5"><p className="text-[10px] uppercase tracking-[0.2em] text-brand-blue">MH Travel account</p><h2 className="mt-2 text-xl font-medium text-text-primary">{mode === 'login' ? t('auth_login_title') : t('auth_signup_title')}</h2><p className="mt-1 text-xs text-text-muted">{mode === 'login' ? t('auth_login_intro') : t('auth_signup_intro')}</p></div>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && <Field icon={UserRound} label={t('auth_full_name')} value={name} onChange={setName} placeholder="Aung Aung" autoComplete="name" />}
            {mode === 'signup' && <Field icon={KeyRound} label={t('auth_phone_optional')} value={phone} onChange={setPhone} placeholder="09 123 456 789" autoComplete="tel" />}
            <Field icon={Mail} label={t('auth_email')} value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" type="email" />
            <label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{t('auth_password')}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><LockKeyhole size={14} className="shrink-0 text-text-faint" /><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" placeholder={t('auth_password_placeholder')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-text-faint hover:text-text-primary" aria-label={t('auth_show_password')}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></label>
            {error && <p role="alert" className="rounded-md border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-[11px] text-brand-redLight">{error}</p>}
            <button disabled={busy} type="submit" className="w-full rounded-md bg-brand-red px-4 py-2.5 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? t('auth_processing') : mode === 'login' ? t('auth_login') : t('auth_create_account')}</button>
          </form>
          {mode === 'login' && <div className="mt-6 border-t border-border pt-5"><div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-faint"><span className="h-px flex-1 bg-border" />{t('auth_admin_preview')}<span className="h-px flex-1 bg-border" /></div><button type="button" onClick={fillDemoAdmin} className="flex w-full items-center justify-center gap-2 rounded-md border border-brand-blue/30 bg-brand-blue/10 px-3 py-2.5 text-xs text-brand-blue hover:bg-brand-blue/15"><ShieldCheck size={14} />{t('auth_use_admin_preview')}</button><p className="mt-2 text-center text-[10px] leading-4 text-text-faint">{t('auth_admin_preview_note')}</p></div>}
        </div>
      </section>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text', autoComplete }: { icon: typeof UserRound; label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{label}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><Icon size={14} className="shrink-0 text-text-faint" /><input required={label !== 'Phone number (optional)' && label !== 'ဖုန်းနံပါတ် (မဖြည့်လည်းရ)' } type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" placeholder={placeholder} autoComplete={autoComplete} /></div></label>;
}
