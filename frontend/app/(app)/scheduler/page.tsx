'use client';

import { useEffect, useState } from 'react';
import { schedulerApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';

interface Schedule {
  id: string; name: string; type: string; frequency: string;
  dayOfWeek?: number; dayOfMonth?: number; hour: number; minute: number;
  channels: string[]; recipientType: string; isActive: boolean;
  lastRunAt?: string; nextRunAt?: string;
}

const DAYS_OF_WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const empty = {
  name: '', type: 'FARMER_INVOICE', frequency: 'DAILY',
  dayOfWeek: 1, dayOfMonth: 1, hour: 8, minute: 0,
  channels: ['EMAIL'] as string[], recipientType: 'ALL_FARMERS',
};

export default function SchedulerPage() {
  const { t } = useLang();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const TYPES = [
    { value: 'FARMER_INVOICE',      label: t('farmerInvoiceSummary') },
    { value: 'RETAILER_INVOICE',    label: t('retailerInvoiceSummary') },
    { value: 'COLLECTION_SUMMARY',  label: t('collectionSummary') },
    { value: 'DELIVERY_SUMMARY',    label: t('deliverySummary') },
    { value: 'BALANCE_REPORT',      label: t('balanceReportLabel') },
    { value: 'PROFIT_LOSS',         label: t('profitLossReport') },
  ];

  const FREQUENCIES = [
    { value: 'DAILY',   label: t('daily') },
    { value: 'WEEKLY',  label: t('weekly') },
    { value: 'MONTHLY', label: t('monthly') },
  ];

  const CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS'];

  const RECIPIENT_TYPES = [
    { value: 'ALL_FARMERS',   label: t('allFarmers') },
    { value: 'ALL_RETAILERS', label: t('allRetailers') },
    { value: 'ADMIN',         label: t('adminOnly') },
  ];

  const typeLabel = (type: string) => TYPES.find((tp) => tp.value === type)?.label ?? type;
  const freqLabel = (freq: string) => FREQUENCIES.find((f) => f.value === freq)?.label ?? freq;
  const recipientLabel = (r: string) => RECIPIENT_TYPES.find((rt) => rt.value === r)?.label ?? r;

  const scheduleDescription = (s: Schedule) => {
    let when = '';
    if (s.frequency === 'DAILY') when = t('everyDay');
    else if (s.frequency === 'WEEKLY') when = `${t('weekly')} — ${DAYS_OF_WEEK_EN[s.dayOfWeek ?? 1]}`;
    else when = `${t('monthly')} — ${t('date')} ${s.dayOfMonth ?? 1}`;
    const time = `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`;
    return `${when} @ ${time}`;
  };

  const load = () => schedulerApi.list().then((r) => setSchedules(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const setF = (key: keyof typeof empty, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const toggleChannel = (ch: string) => {
    setForm((p) => ({
      ...p,
      channels: p.channels.includes(ch) ? p.channels.filter((c) => c !== ch) : [...p.channels, ch],
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channels.length) return alert(t('notificationChannels'));
    setSaving(true);
    try {
      await schedulerApi.create({
        ...form, hour: Number(form.hour), minute: Number(form.minute),
        dayOfWeek: form.frequency === 'WEEKLY' ? Number(form.dayOfWeek) : undefined,
        dayOfMonth: form.frequency === 'MONTHLY' ? Number(form.dayOfMonth) : undefined,
      });
      await load();
      setShowForm(false);
      setForm(empty);
    } finally { setSaving(false); }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await schedulerApi.toggle(id, isActive);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm(t('deactivateConfirm'))) return;
    await schedulerApi.remove(id);
    await load();
  };

  const activeCount = schedules.filter((s) => s.isActive).length;

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('scheduler')}</h1>
          <p className="page-subtitle">{activeCount} {t('schedulerDesc')}</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary">
          + {t('addSchedule')}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
        <span className="text-lg flex-shrink-0">ℹ</span>
        <div>{t('schedulerInfoText')}</div>
      </div>

      {/* Add schedule modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{t('addSchedule')}</h3>
              <button type="button" onClick={() => { setShowForm(false); setForm(empty); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sch-name" className="label">{t('scheduleName')} *</label>
                    <input id="sch-name" required value={form.name} onChange={(e) => setF('name', e.target.value)}
                      placeholder="e.g. Daily Farmer Invoices" className="input" />
                  </div>
                  <div>
                    <label htmlFor="sch-type" className="label">{t('reportType')} *</label>
                    <select id="sch-type" value={form.type} onChange={(e) => setF('type', e.target.value)} className="input">
                      {TYPES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sch-freq" className="label">{t('frequency')} *</label>
                    <select id="sch-freq" value={form.frequency} onChange={(e) => setF('frequency', e.target.value)} className="input">
                      {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  {form.frequency === 'WEEKLY' && (
                    <div>
                      <label htmlFor="sch-dow" className="label">{t('tripDate')}</label>
                      <select id="sch-dow" value={form.dayOfWeek} onChange={(e) => setF('dayOfWeek', Number(e.target.value))} className="input">
                        {DAYS_OF_WEEK_EN.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {form.frequency === 'MONTHLY' && (
                    <div>
                      <label htmlFor="sch-dom" className="label">{t('date')}</label>
                      <input id="sch-dom" type="number" min="1" max="28" value={form.dayOfMonth}
                        onChange={(e) => setF('dayOfMonth', Number(e.target.value))} className="input" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label htmlFor="sch-hour" className="label">{t('startedAt')} (0–23)</label>
                      <input id="sch-hour" type="number" min="0" max="23" value={form.hour}
                        onChange={(e) => setF('hour', Number(e.target.value))} className="input" />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="sch-minute" className="label">Min (0–59)</label>
                      <input id="sch-minute" type="number" min="0" max="59" value={form.minute}
                        onChange={(e) => setF('minute', Number(e.target.value))} className="input" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sch-recipients" className="label">{t('recipients')}</label>
                    <select id="sch-recipients" value={form.recipientType} onChange={(e) => setF('recipientType', e.target.value)} className="input">
                      {RECIPIENT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span className="label block mb-2">{t('notificationChannels')} *</span>
                  <div className="flex gap-5 flex-wrap">
                    {CHANNELS.map((ch) => (
                      <label key={ch} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)}
                          className="w-4 h-4 accent-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowForm(false); setForm(empty); }}
                  className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t('saving') : t('createSchedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="text-center text-gray-400 dark:text-slate-500 py-10 text-sm animate-pulse">{t('loading')}</div>
      ) : schedules.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="empty-state">
            <span className="empty-state-icon">🔔</span>
            <span className="empty-state-text">{t('noSchedules')}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id}
              className={`card p-4 flex flex-wrap items-start justify-between gap-3 transition-all ${s.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{s.name}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="badge badge-blue">{typeLabel(s.type)}</span>
                    <span className="badge badge-gray">{freqLabel(s.frequency)}</span>
                    <span className="badge badge-amber">{recipientLabel(s.recipientType)}</span>
                    {(s.channels as string[]).map((ch) => (
                      <span key={ch} className="badge badge-green">{ch}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 flex flex-wrap gap-3">
                    <span>🕐 {scheduleDescription(s)}</span>
                    {s.nextRunAt && <span>{t('nextRun')}: {new Date(s.nextRunAt).toLocaleDateString()}</span>}
                    {s.lastRunAt && <span>{t('lastRun')}: {new Date(s.lastRunAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => toggle(s.id, !s.isActive)}
                  className={`btn text-xs py-1.5 ${s.isActive ? 'btn-secondary' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'}`}>
                  {s.isActive ? t('pause') : t('resume')}
                </button>
                <button type="button" onClick={() => remove(s.id)}
                  className="btn text-xs py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {t('deleteSchedule')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
