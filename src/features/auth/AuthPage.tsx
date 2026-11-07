import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const { t } = useLanguage();
  const { login, signup, isAuthenticated, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mode: AuthMode = location.pathname === '/signup' ? 'signup' : 'login';
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(isSuperAdmin ? '/super-admin' : '/account', { replace: true });
  }, [isAuthenticated, isSuperAdmin, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth_password_mismatch'));
      return;
    }
    setBusy(true);
    const result = mode === 'login'
      ? await login(username, password)
      : await signup({ username, name, email, password });
    setBusy(false);
    if (!result.ok) setError(result.message ? t(result.message as never) : t('auth_generic_error'));
  }

  return <div className="mx-auto flex min-h-[calc(100vh-170px)] max-w-6xl items-center justify-center py-8"><section className="grid w-full overflow-hidden rounded-card border border-border bg-bg-card lg:grid-cols-[0.85fr_1.15fr]"><AuthIntro /><div className="p-5 sm:p-8"><div className="mb-5"><p className="text-[10px] uppercase tracking-[0.2em] text-brand-blue">MH Travel account</p><h1 className="mt-2 text-xl font-medium text-text-primary">{mode === 'login' ? t('auth_login_title') : t('auth_signup_title')}</h1><p className="mt-1 text-xs text-text-muted">{mode === 'login' ? t('auth_login_intro') : t('auth_signup_intro')}</p></div><form onSubmit={submit} className="space-y-3">{mode === 'signup' && <><Field icon={UserRound} label={t('auth_username')} value={username} onChange={setUsername} placeholder="aung_aung" autoComplete="username" /><Field icon={UserRound} label={t('auth_full_name')} value={name} onChange={setName} placeholder="Aung Aung" autoComplete="name" /><Field icon={Mail} label={t('auth_email')} value={email} onChange={setEmail} placeholder="you@gmail.com" autoComplete="email" type="email" /></>}{mode === 'login' && <Field icon={UserRound} label={t('auth_username_or_email')} value={username} onChange={setUsername} placeholder="aung_aung or you@gmail.com" autoComplete="username" />}{mode === 'login' && <PasswordField value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} label={t('auth_password')} placeholder={t('auth_password_placeholder')} autoComplete="current-password" />}{mode === 'signup' && <><PasswordField value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} label={t('auth_password')} placeholder={t('auth_password_placeholder')} autoComplete="new-password" /><PasswordField value={confirmPassword} onChange={setConfirmPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} label={t('auth_confirm_password')} placeholder={t('auth_confirm_password_placeholder')} autoComplete="new-password" /></>}{error && <p role="alert" className="rounded-md border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-[11px] text-brand-redLight">{error}</p>}<button disabled={busy} type="submit" className="w-full rounded-md bg-brand-red px-4 py-2.5 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? t('auth_processing') : mode === 'login' ? t('auth_login') : t('auth_create_account')}</button></form>{mode === 'signup' && <><div className="my-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-faint"><span className="h-px flex-1 bg-border" />{t('auth_or_continue_with')}<span className="h-px flex-1 bg-border" /></div><div className="grid grid-cols-2 gap-2"><SocialButton label="Google" icon="G" onClick={() => setError(t('auth_social_setup_pending'))} /><SocialButton label="Facebook" icon="f" onClick={() => setError(t('auth_social_setup_pending'))} /></div></>}<p className="mt-6 border-t border-border pt-5 text-center text-xs text-text-muted">{mode === 'login' ? t('auth_no_account') : t('auth_have_account')} <Link to={mode === 'login' ? '/signup' : '/login'} className="font-medium text-brand-blue hover:underline">{mode === 'login' ? t('auth_signup') : t('auth_login')}</Link></p></div></section></div>;
}

function AuthIntro() { const { t } = useLanguage(); return <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blueDark via-bg-card to-bg-cardAlt p-8 lg:block"><div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-blue/20 blur-3xl" /><div className="relative flex h-full flex-col justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-blue">MH Travel</p><h2 className="mt-5 max-w-sm text-3xl font-medium leading-tight text-white">{t('auth_hero_title')}</h2><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/70">{t('auth_hero_intro')}</p></div><div className="rounded-lg border border-white/10 bg-black/15 p-4"><div className="flex items-center gap-2 text-sm text-white"><ShieldCheck size={16} className="text-brand-blue" />{t('auth_secure_note')}</div><p className="mt-2 text-xs leading-5 text-blue-100/60">{t('auth_secure_detail')}</p></div></div></div>; }

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text', autoComplete }: { icon: typeof UserRound; label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) { return <label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{label}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><Icon size={14} className="shrink-0 text-text-faint" /><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" placeholder={placeholder} autoComplete={autoComplete} /></div></label>; }
function PasswordField({ value, onChange, show, onToggle, label, placeholder, autoComplete }: { value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; label: string; placeholder: string; autoComplete: string }) { return <label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{label}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><LockKeyhole size={14} className="shrink-0 text-text-faint" /><input required minLength={8} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" placeholder={placeholder} autoComplete={autoComplete} /><button type="button" onClick={onToggle} className="text-text-faint hover:text-text-primary" aria-label="Toggle password visibility">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></label>; }
function SocialButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-md border border-border bg-bg-cardAlt px-3 py-2.5 text-xs text-text-secondary hover:border-brand-blue/50 hover:text-text-primary"><span className="font-semibold text-brand-blue">{icon}</span>{label}</button>; }
