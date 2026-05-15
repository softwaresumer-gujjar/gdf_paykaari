'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLang } from '@/lib/language-context';
import { publicBrandingApi, authApi } from '@/lib/api';

interface Branding {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [branding, setBranding] = useState<Branding>({ primaryColor: '#2563eb' });
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const router = useRouter();

  useEffect(() => {
    publicBrandingApi.get().then((r) => setBranding(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const primary = branding.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <style>{`.login-brand-bg{background-color:${primary}}.login-submit{background-color:${primary}}.login-submit:hover{filter:brightness(0.9)}.lang-btn-active{background-color:${primary}}`}</style>

      {/* Language switcher */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 flex items-center rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 text-xs font-semibold shadow-sm">
        <button type="button" onClick={() => setLang('en')}
          className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'lang-btn-active text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'}`}>
          EN
        </button>
        <button type="button" onClick={() => setLang('ur')}
          className={`px-3 py-1.5 transition-colors ${lang === 'ur' ? 'lang-btn-active text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'}`}>
          اردو
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {/* Branding header */}
          <div className="login-brand-bg px-8 py-6 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-contain bg-white/20 p-0.5" />
                : <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🥛</div>
              }
              <div className="text-xl font-bold tracking-tight">{branding.brandName || 'MilkFlow'}</div>
            </div>
            {branding.tagline && <div className="text-xs opacity-80 mt-0.5">{branding.tagline}</div>}
          </div>

          <div className="p-8">
            {showForgot ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300 text-center">
                  {t('inviteOnly')}
                </div>
                <button type="button" onClick={() => setShowForgot(false)}
                  className="w-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  ←
                </button>
              </div>
            ) : (
              <>
                <div className="text-gray-500 dark:text-slate-400 text-sm mb-6 text-center">{t('signInToAccount')}</div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="login-email">
                      {t('email')}
                    </label>
                    <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required dir="ltr" placeholder="you@example.com"
                      className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300" htmlFor="login-password">
                        {t('password')}
                      </label>
                      <button type="button" onClick={() => setShowForgot(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        {t('forgotPassword')}
                      </button>
                    </div>
                    <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      required dir="ltr"
                      className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="login-submit w-full text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-all">
                    {loading ? t('signingIn') : t('signIn')}
                  </button>
                </form>

                {/* Divider */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs text-gray-400 dark:text-slate-500">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                </div>

                {/* Google sign-in */}
                <a
                  href={authApi.googleAuthUrl()}
                  className="mt-4 flex items-center justify-center gap-2.5 w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </a>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2">
                    {t('inviteOnly')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
