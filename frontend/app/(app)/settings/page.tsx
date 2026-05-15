'use client';

import { useEffect, useRef, useState } from 'react';
import { orgSettingsApi, subscriptionApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface OrgSettings {
  brandName?: string; tagline?: string; logoUrl?: string;
  primaryColor?: string; accentColor?: string;
  invoiceHeader?: string; invoiceFooter?: string;
  signatureUrl?: string; signatureName?: string; signatureTitle?: string;
  address?: string; phone?: string; email?: string; website?: string;
  taxId?: string; bankName?: string; bankAccount?: string; bankIban?: string;
}

interface PlanFeatures {
  collection: boolean; delivery: boolean; billing: boolean;
  reports: boolean; accounts: boolean; transport: boolean;
  staff: boolean; multiUser: boolean;
  maxFarmers: number; maxRetailers: number;
  durationDays: number; price: number; label: string;
}

interface PlanInfo extends PlanFeatures { key: string }

interface SubData {
  plan: string; planLabel: string; status: string;
  startDate: string; endDate: string; daysRemaining: number;
  amountPaid: number; features: PlanFeatures;
  allPlans: PlanInfo[];
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const DEFAULT: OrgSettings = {
  brandName: '', tagline: '', logoUrl: '', primaryColor: '#2563eb', accentColor: '#16a34a',
  invoiceHeader: '', invoiceFooter: '', signatureUrl: '', signatureName: '', signatureTitle: '',
  address: '', phone: '', email: '', website: '', taxId: '',
  bankName: '', bankAccount: '', bankIban: '',
};

const INPUT = 'w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-slate-400 mb-0.5';

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700 border-gray-200',
  BASIC: 'bg-blue-100 text-blue-700 border-blue-200',
  STANDARD: 'bg-purple-100 text-purple-700 border-purple-200',
  PREMIUM: 'bg-amber-100 text-amber-700 border-amber-200',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
          {enabled ? '✓' : '✗'}
        </span>
        <span className={`text-sm ${enabled ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'}`}>{label}</span>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<'org' | 'sub'>('org');
  const [form, setForm] = useState<OrgSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sub, setSub] = useState<SubData | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    orgSettingsApi.get()
      .then((r) => setForm({ ...DEFAULT, ...r.data }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'sub' && !sub) {
      setSubLoading(true);
      subscriptionApi.current()
        .then((r) => setSub(r.data))
        .finally(() => setSubLoading(false));
    }
  }, [tab, sub]);

  const set = (key: keyof OrgSettings, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleFile = (key: 'logoUrl' | 'signatureUrl') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => set(key, reader.result as string);
      reader.readAsDataURL(file);
    };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      await orgSettingsApi.update(form as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="w-full flex items-center justify-center py-20 text-gray-400 text-sm animate-pulse">{t('loading')}</div>;
  }

  /* ── Subscription dates ── */
  const subDaysTotal = sub ? Math.ceil(
    (new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;
  const subDaysUsed = sub ? subDaysTotal - sub.daysRemaining : 0;
  const subPct = subDaysTotal > 0 ? Math.min(100, Math.round((subDaysUsed / subDaysTotal) * 100)) : 100;
  const isExpiring = sub ? (sub.daysRemaining <= 3 && sub.status === 'ACTIVE') : false;

  return (
    <div className="w-full space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('settings')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{t('save')}</p>
        </div>
        {tab === 'org' && (
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium">✓ {t('saved')}</span>}
            <button form="settings-form" type="submit" disabled={saving}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['org', 'sub'] as const).map((tabKey) => (
          <button key={tabKey} type="button"
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === tabKey
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}>
            {tabKey === 'org' ? t('organization') : t('subscription')}
          </button>
        ))}
      </div>

      {/* ── Organization Tab ── */}
      {tab === 'org' && (
        <form id="settings-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Branding */}
            <Card title={t('brandName')} icon="🎨">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={LABEL} htmlFor="s-brand">{t('brandName')}</label>
                  <input id="s-brand" value={form.brandName || ''} onChange={(e) => set('brandName', e.target.value)} className={INPUT} placeholder="MilkFlow Co." />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-tagline">{t('tagline')}</label>
                  <input id="s-tagline" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} className={INPUT} placeholder="Fresh every day" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={LABEL} htmlFor="s-primary">{t('primaryColor')}</label>
                  <div className="flex gap-1.5">
                    <input id="s-primary" type="color" value={form.primaryColor || '#2563eb'} onChange={(e) => set('primaryColor', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                    <input aria-label="Primary color hex value" value={form.primaryColor || ''} onChange={(e) => set('primaryColor', e.target.value)} className={`${INPUT} font-mono flex-1`} />
                  </div>
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-accent">{t('accentColor')}</label>
                  <div className="flex gap-1.5">
                    <input id="s-accent" type="color" value={form.accentColor || '#16a34a'} onChange={(e) => set('accentColor', e.target.value)}
                      className="w-8 h-7 rounded border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                    <input aria-label="Accent color hex value" value={form.accentColor || ''} onChange={(e) => set('accentColor', e.target.value)} className={`${INPUT} font-mono flex-1`} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" className="h-11 w-11 rounded-lg object-contain border border-gray-200 bg-gray-50 flex-shrink-0" />
                  : <div className="h-11 w-11 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xl text-gray-300 flex-shrink-0">🏢</div>
                }
                <div>
                  <label className={LABEL} htmlFor="s-logo">{t('logo')}</label>
                  <input id="s-logo" ref={logoRef} type="file" accept="image/*" onChange={handleFile('logoUrl')}
                    className="text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>
            </Card>

            {/* Business Details */}
            <Card title={t('businessDetails')} icon="🏢">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {([
                  ['s-address', t('address'),  'address'],
                  ['s-phone',   t('phone'),    'phone'],
                  ['s-email',   t('email'),    'email'],
                  ['s-website', t('websiteLabel'), 'website'],
                  ['s-tax',     t('taxId'),    'taxId'],
                ] as [string, string, keyof OrgSettings][]).map(([id, label, key]) => (
                  <div key={key}>
                    <label className={LABEL} htmlFor={id}>{label}</label>
                    <input id={id} value={form[key] || ''} onChange={(e) => set(key, e.target.value)} className={INPUT} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bank Details */}
            <Card title={t('bankDetails')} icon="🏦">
              <div className="space-y-2.5">
                {([
                  ['s-bank', t('bankName'),   'bankName'],
                  ['s-acct', t('accountNo'),  'bankAccount'],
                  ['s-iban', t('iban'),        'bankIban'],
                ] as [string, string, keyof OrgSettings][]).map(([id, label, key]) => (
                  <div key={key}>
                    <label className={LABEL} htmlFor={id}>{label}</label>
                    <input id={id} value={form[key] || ''} onChange={(e) => set(key, e.target.value)} className={`${INPUT} font-mono`} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Invoice Template */}
            <Card title={t('invoiceTemplate')} icon="🧾">
              <div className="space-y-2.5">
                <div>
                  <label className={LABEL} htmlFor="s-inv-header">{t('invoiceTemplate')} (header)</label>
                  <textarea id="s-inv-header" rows={2} value={form.invoiceHeader || ''} onChange={(e) => set('invoiceHeader', e.target.value)}
                    className={`${INPUT} resize-none`} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-inv-footer">Footer / Terms</label>
                  <textarea id="s-inv-footer" rows={2} value={form.invoiceFooter || ''} onChange={(e) => set('invoiceFooter', e.target.value)}
                    className={`${INPUT} resize-none`} />
                </div>
              </div>
            </Card>

            {/* Signature */}
            <Card title={t('signature')} icon="✍️">
              <div className="space-y-2.5">
                <div>
                  {form.signatureUrl
                    ? <img src={form.signatureUrl} alt="Signature" className="h-14 max-w-[180px] object-contain border border-gray-200 rounded-lg bg-gray-50 p-1.5" />
                    : <div className="h-14 w-full bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">No signature</div>
                  }
                  <input ref={sigRef} type="file" accept="image/*" title="Upload signature image" onChange={handleFile('signatureUrl')}
                    className="mt-1.5 text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-sig-name">Signatory Name</label>
                  <input id="s-sig-name" value={form.signatureName || ''} onChange={(e) => set('signatureName', e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-sig-title">Title / Designation</label>
                  <input id="s-sig-title" value={form.signatureTitle || ''} onChange={(e) => set('signatureTitle', e.target.value)} className={INPUT} />
                </div>
              </div>
            </Card>
          </div>

          {/* Invoice preview */}
          <style>{`.invoice-preview-header{background-color:${form.primaryColor || '#2563eb'}}`}</style>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('invoicePreview')}</div>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-lg">
              <div className="invoice-preview-header px-4 py-3 flex items-center justify-between text-white text-xs">
                <div>
                  <div className="font-bold text-sm">{form.brandName || 'Your Business Name'}</div>
                  <div className="opacity-80 text-[11px] mt-0.5">{form.tagline || 'Tagline here'}</div>
                </div>
                {form.logoUrl && <img src={form.logoUrl} alt="logo" className="h-8 w-8 rounded object-contain bg-white/20 p-0.5" />}
              </div>
              <div className="bg-white px-4 py-2 text-[11px] text-gray-500">
                {form.address || 'Address'} · {form.phone || 'Phone'} · {form.email || 'Email'}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Subscription Tab ── */}
      {tab === 'sub' && (
        <div className="space-y-6">
          {subLoading && (
            <div className="w-full flex items-center justify-center py-20 text-gray-400 text-sm animate-pulse">{t('loading')}</div>
          )}
          {!subLoading && sub && (() => {
            const daysTotal = Math.ceil((new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24));
            const daysUsed = daysTotal - sub.daysRemaining;
            const pct = daysTotal > 0 ? Math.min(100, Math.round((daysUsed / daysTotal) * 100)) : 100;
            const expiring = sub.daysRemaining <= 3 && sub.status === 'ACTIVE';
            return (
              <>
                {/* Current plan card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 ${sub.plan === 'PREMIUM' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${PLAN_COLORS[sub.plan] || 'bg-gray-100 text-gray-700'}`}>
                        {sub.plan === 'TRIAL' ? '🆓 ' : sub.plan === 'PREMIUM' ? '👑 ' : sub.plan === 'STANDARD' ? '⭐ ' : ''}
                        {sub.planLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                        {sub.status}
                      </span>
                    </div>
                    {sub.amountPaid > 0 && (
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        Paid: <span className="font-semibold text-gray-900 dark:text-slate-100">PKR {sub.amountPaid.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-medium mb-3">Validity Period</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Start</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200">{new Date(sub.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">End</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200">{new Date(sub.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-medium mb-3">Time Remaining</div>
                      <div className={`text-3xl font-bold mb-1 ${sub.status === 'EXPIRED' ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-gray-900 dark:text-slate-100'}`}>
                        {sub.status === 'EXPIRED' ? 'Expired' : `${sub.daysRemaining}d`}
                      </div>
                      <div className="text-xs text-gray-400">{daysUsed} of {daysTotal} days used</div>
                      <div className="mt-2 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <style>{`.sub-progress{width:${pct}%}`}</style>
                        <div className={`sub-progress h-full rounded-full transition-all ${sub.status === 'EXPIRED' ? 'bg-red-400' : expiring ? 'bg-amber-400' : 'bg-blue-500'}`} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-medium mb-3">Limits</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Farmers</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200">{sub.features.maxFarmers === -1 ? 'Unlimited' : sub.features.maxFarmers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Retailers</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200">{sub.features.maxRetailers === -1 ? 'Unlimited' : sub.features.maxRetailers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Multi-User</span>
                          <span className={`font-medium ${sub.features.multiUser ? 'text-green-600' : 'text-gray-400'}`}>{sub.features.multiUser ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {expiring && (
                    <div className="px-6 pb-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                        Subscription expires in {sub.daysRemaining} day{sub.daysRemaining !== 1 ? 's' : ''}. Contact your provider to renew.
                      </div>
                    </div>
                  )}
                  {sub.status === 'EXPIRED' && (
                    <div className="px-6 pb-5">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                        Subscription expired. Contact your provider.
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
                  <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Features in Your Plan</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <div>
                      <FeatureRow label="🥛 Milk Collection" enabled={sub.features.collection} />
                      <FeatureRow label="🚚 Milk Delivery" enabled={sub.features.delivery} />
                      <FeatureRow label="🧾 Billing & Invoices" enabled={sub.features.billing} />
                      <FeatureRow label="💳 Payments" enabled={sub.features.billing} />
                      <FeatureRow label="📊 Reports" enabled={sub.features.reports} />
                    </div>
                    <div>
                      <FeatureRow label="💰 Accounts" enabled={sub.features.accounts} />
                      <FeatureRow label="⚖️ Receivables & Payables" enabled={sub.features.accounts} />
                      <FeatureRow label="🛣️ Transport" enabled={sub.features.transport} />
                      <FeatureRow label="👥 Staff" enabled={sub.features.staff} />
                      <FeatureRow label="👤 Multi-User" enabled={sub.features.multiUser} />
                    </div>
                  </div>
                </div>

                {/* Plan comparison */}
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Available Plans</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {sub.allPlans.map((plan) => {
                      const isCurrent = plan.key === sub.plan;
                      return (
                        <div key={plan.key}
                          className={`rounded-xl border p-5 space-y-3 transition-all ${isCurrent ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan.key] || ''}`}>{plan.key}</span>
                            {isCurrent && <span className="text-xs text-blue-600 font-semibold">Current</span>}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-slate-100">{plan.label}</div>
                            <div className={`text-2xl font-bold mt-1 ${isCurrent ? 'text-blue-700' : 'text-gray-900 dark:text-slate-100'}`}>
                              {plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}`}
                              {plan.price > 0 && <span className="text-xs font-normal text-gray-400">/mo</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{plan.durationDays} days</div>
                          </div>
                          <div className="text-xs space-y-1 text-gray-600 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-700">
                            <div>{plan.maxFarmers === -1 ? 'Unlimited' : plan.maxFarmers} farmers</div>
                            <div>{plan.maxRetailers === -1 ? 'Unlimited' : plan.maxRetailers} retailers</div>
                            {plan.billing && <div className="text-green-600">✓ Billing + Payments</div>}
                            {plan.reports && <div className="text-green-600">✓ Reports</div>}
                            {plan.accounts && <div className="text-green-600">✓ Accounts</div>}
                            {plan.transport && <div className="text-green-600">✓ Transport</div>}
                            {plan.staff && <div className="text-green-600">✓ Staff</div>}
                            {plan.multiUser && <div className="text-green-600">✓ Multi-user</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">To upgrade your subscription, contact your MilkFlow provider.</p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
