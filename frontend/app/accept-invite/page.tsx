'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLang } from '@/lib/language-context';
import { acceptInviteApi, publicBrandingApi } from '@/lib/api';

interface Branding { brandName?: string; logoUrl?: string; primaryColor?: string; tagline?: string }

function AcceptInviteForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding>({ primaryColor: '#2563eb' });
  const { refresh } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  useEffect(() => {
    publicBrandingApi.get().then((r) => setBranding(r.data)).catch(() => {});
    if (!token) router.replace('/login');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError(t('passwordMismatch')); return; }
    setError('');
    setLoading(true);
    try {
      await acceptInviteApi.accept(token, password);
      await refresh();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('invalidToken'));
    } finally { setLoading(false); }
  };

  const primary = branding.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <style>{`.invite-header{background-color:${primary}}.invite-btn{background-color:${primary}}.invite-btn:hover{filter:brightness(0.9)}`}</style>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="invite-header px-8 py-5 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="logo" className="h-9 w-9 rounded-xl object-contain bg-white/20 p-0.5" />
                : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🥛</div>}
              <div className="text-lg font-bold">{branding.brandName || 'MilkFlow'}</div>
            </div>
          </div>

          <div className="p-8">
            <div className="text-gray-900 dark:text-slate-100 font-semibold text-base mb-1">{t('acceptInviteTitle')}</div>
            <div className="text-gray-500 dark:text-slate-400 text-sm mb-6">{t('acceptInviteSubtitle')}</div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="inv-pw">
                  {t('newPassword')}
                </label>
                <input id="inv-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} dir="ltr"
                  className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="inv-confirm">
                  {t('confirmPassword')}
                </label>
                <input id="inv-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required minLength={6} dir="ltr"
                  className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="invite-btn w-full text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-all">
                {loading ? t('activating') : t('activateAccount')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
