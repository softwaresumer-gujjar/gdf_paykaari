'use client';

import { useEffect, useMemo, useState } from 'react';
import { deliveryApi, retailersApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import { useSubscription } from '@/lib/subscription-context';

interface Retailer { id: string; name: string; committedMaunds: number }
interface Entry {
  id: string; date: string; session: 'MORNING' | 'EVENING';
  retailer: { name: string }; deliveredMaunds: number;
}
interface Summary {
  total: { muns: number; count: number };
  morning: { muns: number; count: number };
  evening: { muns: number; count: number };
}
interface BulkRow {
  retailerId: string; name: string; committedMaunds: number;
  morning: string; evening: string;
}
type SortKey = 'retailer' | 'session' | 'deliveredMaunds';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  const active = col === sortKey;
  return (
    <svg className={`sort-icon ${active ? 'active' : ''}`} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4l4 6H4l4-6z"     opacity={active && sortDir === 'asc'  ? 1 : 0.3} />
      <path d="M8 12l-4-6h8l-4 6z" opacity={active && sortDir === 'desc' ? 1 : 0.3} />
    </svg>
  );
}

export default function DeliveryPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [tab, setTab] = useState<'input' | 'history'>('input');
  const [sortKey, setSortKey] = useState<SortKey>('retailer');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const load = async () => {
    const [e, s] = await Promise.all([deliveryApi.list(date, 1, 200), deliveryApi.summary(date)]);
    setEntries(e.data?.items ?? e.data ?? []);
    setSummary(s.data);
  };

  useEffect(() => {
    retailersApi.list().then((r) => {
      const active = (r.data as (Retailer & { isActive?: boolean })[]).filter((x) => x.isActive !== false);
      setRows(active.map((x) => ({
        retailerId: x.id, name: x.name,
        committedMaunds: Number(x.committedMaunds),
        morning: '', evening: '',
      })));
    });
  }, []);

  useEffect(() => { load(); }, [date]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'retailer') cmp = a.retailer.name.localeCompare(b.retailer.name);
    else if (sortKey === 'session') cmp = a.session.localeCompare(b.session);
    else cmp = Number(a.deliveredMaunds) - Number(b.deliveredMaunds);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [entries, sortKey, sortDir]);

  const updateRow = (idx: number, field: 'morning' | 'evening', value: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const saveAll = async () => {
    const toSave = rows.filter((r) => r.morning !== '' || r.evening !== '');
    if (!toSave.length) return;
    setSaving(true); setSaveResult(null);
    try {
      const promises: Promise<unknown>[] = [];
      for (const row of toSave) {
        if (row.morning !== '' && Number(row.morning) >= 0)
          promises.push(deliveryApi.create({ date, session: 'MORNING', retailerId: row.retailerId, deliveredMaunds: Number(row.morning) }));
        if (row.evening !== '' && Number(row.evening) >= 0)
          promises.push(deliveryApi.create({ date, session: 'EVENING', retailerId: row.retailerId, deliveredMaunds: Number(row.evening) }));
      }
      await Promise.all(promises);
      setSaveResult({ saved: toSave.length, skipped: rows.length - toSave.length });
      await load();
      setRows((prev) => prev.map((r) => ({ ...r, morning: '', evening: '' })));
    } finally { setSaving(false); }
  };

  const totalMorning = rows.reduce((s, r) => s + (r.morning ? Number(r.morning) : 0), 0);
  const totalEvening = rows.reduce((s, r) => s + (r.evening ? Number(r.evening) : 0), 0);
  const filledRows = rows.filter((r) => r.morning !== '' || r.evening !== '').length;

  const historyHeaders: { key: SortKey; label: string }[] = [
    { key: 'retailer',       label: t('retailer') },
    { key: 'session',        label: t('session') },
    { key: 'deliveredMaunds', label: `${t('maunds')} (${t('maundsUnit')})` },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('delivery')}</h1>
          <p className="page-subtitle">{t('deliveryHistory')}</p>
        </div>
        <input id="del-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
          title={t('selectDateLabel')} className="input w-auto" />
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium tracking-wide mb-1">{t('deliveredStat')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {summary.total.muns} <span className="text-sm font-normal text-gray-400">{t('maundsUnit')}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{summary.total.count} {t('totalEntries')}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40 p-4">
            <div className="text-xs text-amber-700 dark:text-amber-400 uppercase font-medium tracking-wide mb-1">☀ {t('morning')}</div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {summary.morning.muns} <span className="text-sm font-normal text-amber-600">{t('maundsUnit')}</span>
            </div>
            <div className="text-xs text-amber-500 mt-0.5">{summary.morning.count} {t('totalEntries')}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/40 p-4">
            <div className="text-xs text-indigo-700 dark:text-indigo-400 uppercase font-medium tracking-wide mb-1">🌙 {t('evening')}</div>
            <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">
              {summary.evening.muns} <span className="text-sm font-normal text-indigo-600">{t('maundsUnit')}</span>
            </div>
            <div className="text-xs text-indigo-500 mt-0.5">{summary.evening.count} {t('totalEntries')}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-group w-fit">
        <button type="button" onClick={() => setTab('input')} className={`tab-btn ${tab === 'input' ? 'active' : ''}`}>{t('inputTab')}</button>
        <button type="button" onClick={() => setTab('history')} className={`tab-btn ${tab === 'history' ? 'active' : ''}`}>{t('historyTab')}</button>
      </div>

      {/* Bulk input */}
      {tab === 'input' && (
        <div className="space-y-3">
          {saveResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
              ✓ {saveResult.saved} {t('savedCount')}
              {saveResult.skipped > 0 && ` · ${saveResult.skipped} ${t('skippedCount')}`}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="filter-bar justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                {t('bulkEntry')} — {new Date(date).toLocaleDateString()}
              </span>
              {filledRows > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{t('totalMorning')}: <strong className="text-amber-700">{totalMorning} {t('maundsUnit')}</strong></span>
                  <span>{t('totalEvening')}: <strong className="text-indigo-700">{totalEvening} {t('maundsUnit')}</strong></span>
                </div>
              )}
            </div>
            <div className="table-scroll">
              <table className="data-table min-w-[500px]">
                <thead>
                  <tr>
                    <th>{t('retailer')}</th>
                    <th className="text-gray-400 normal-case text-xs font-normal">{t('committedLabel')}/{t('today').toLowerCase()}</th>
                    <th><span className="text-amber-600">☀ {t('morningQty')}</span></th>
                    <th><span className="text-indigo-600">🌙 {t('eveningQty')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const hasData = row.morning !== '' || row.evening !== '';
                    return (
                      <tr key={row.retailerId} className={hasData ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                        <td className="font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">{row.name}</td>
                        <td className="text-gray-400 text-xs">{row.committedMaunds}</td>
                        <td>
                          <input type="number" min="0" step="0.5" placeholder="0"
                            title={`${row.name} ${t('morning')}`}
                            value={row.morning} disabled={isReadonly}
                            onChange={(e) => updateRow(idx, 'morning', e.target.value)}
                            className={`w-24 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${row.morning !== '' ? 'border-amber-300 bg-amber-50' : 'border-gray-300 dark:border-slate-600'}`}
                          />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.5" placeholder="0"
                            title={`${row.name} ${t('evening')}`}
                            value={row.evening} disabled={isReadonly}
                            onChange={(e) => updateRow(idx, 'evening', e.target.value)}
                            className={`w-24 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${row.evening !== '' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 dark:border-slate-600'}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filledRows > 0 && (
                    <tr className="bg-gray-50 dark:bg-slate-800/60 font-semibold">
                      <td colSpan={2} className="text-gray-700 dark:text-slate-200">{t('grandTotal')}</td>
                      <td className="text-amber-700 dark:text-amber-400">{totalMorning} {t('maundsUnit')}</td>
                      <td className="text-indigo-700 dark:text-indigo-400">{totalEvening} {t('maundsUnit')}</td>
                    </tr>
                  )}
                  {!rows.length && (
                    <tr><td colSpan={4}><div className="empty-state"><span className="empty-state-icon">🏪</span><span className="empty-state-text">{t('noRetailers')}</span></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={saveAll} disabled={saving || filledRows === 0 || isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? t('saving') : t('saveEntries')}
            </button>
            {filledRows > 0 && (
              <button type="button"
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, morning: '', evening: '' })))}
                className="btn btn-secondary">{t('clearFilters')}</button>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="card overflow-hidden">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {historyHeaders.map(({ key, label }) => (
                    <th key={key} onClick={() => toggleSort(key)}>
                      <span className="th-sort">{label}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} /></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-900 dark:text-slate-100">{e.retailer.name}</td>
                    <td>
                      <span className={`badge ${e.session === 'MORNING' ? 'badge-amber' : 'badge-blue'}`}>
                        {e.session === 'MORNING' ? `☀ ${t('morning')}` : `🌙 ${t('evening')}`}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-900 dark:text-slate-100" dir="ltr">
                      {Number(e.deliveredMaunds).toFixed(2)} {t('maundsUnit')}
                    </td>
                  </tr>
                ))}
                {!sortedEntries.length && (
                  <tr><td colSpan={3}><div className="empty-state"><span className="empty-state-icon">🚚</span><span className="empty-state-text">{t('noEntries')}</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
