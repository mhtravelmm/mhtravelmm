import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';

export function AdminLoginPage() {
  const { t } = useLanguage();
  const { loginAdmin, isAuthenticated, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) navigate('/super-admin', { replace: true });
  }, [isAuthenticated, isSuperAdmin, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await loginAdmin(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message ? t(result.message as never) : t('auth_generic_error'));
      return;
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8"><section className="w-full max-w-lg rounded-card border border-brand-blue/30 bg-bg-card p-5 shadow-2xl sm:p-8"><div className="mb-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/15 text-brand-blue"><ShieldCheck size={23} /></div><p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-brand-blue">MH Travel · {t('admin_portal')}</p><h1 className="mt-2 text-xl font-medium text-text-primary">{t('admin_login_title')}</h1><p className="mt-2 text-xs leading-5 text-text-muted">{t('admin_login_intro')}</p></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{t('auth_email')}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><Mail size={14} className="text-text-faint" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" autoComplete="username" /></div></label><label className="block"><span className="mb-1.5 block text-[11px] text-text-secondary">{t('auth_password')}</span><div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue"><LockKeyhole size={14} className="text-text-faint" /><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-text-faint hover:text-text-primary" aria-label={t('auth_show_password')}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></label>{error && <p role="alert" className="rounded-md border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-[11px] text-brand-redLight">{error}</p>}<button disabled={busy} type="submit" className="w-full rounded-md bg-brand-blue px-4 py-2.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-60">{busy ? t('auth_processing') : t('admin_login_button')}</button></form><div className="mt-6 border-t border-border pt-4 text-center"><button type="button" onClick={() => navigate('/login')} className="text-[11px] text-text-faint hover:text-text-primary">{t('admin_back_to_user_login')}</button></div></section></div>;
}
