'use client';

import { useEffect, useMemo, useState } from 'react';
import { marketRatesApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import type { TranslationKey } from '@/lib/lang';
import { Pagination } from '@/components/pagination';
import { useSubscription } from '@/lib/subscription-context';

const PAGE_LIMIT = 30;

interface Rate { id: string; date: string; session: string; ratePerMaund: number }
type SortKey = 'date' | 'session' | 'ratePerMaund';
type SortDir = 'asc' | 'desc';

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/* ─── Trend line chart (SVG) ────────────────────────────────────────────── */
function TrendChart({ rates }: { rates: Rate[] }) {
  if (rates.length < 2) return null;

  const sorted = [...rates].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const dates = [...new Set(sorted.map((r) => r.date))].sort();

  const morningMap = new Map<string, number>();
  const eveningMap = new Map<string, number>();
  sorted.forEach((r) => {
    if (r.session === 'MORNING') morningMap.set(r.date, Number(r.ratePerMaund));
    else eveningMap.set(r.date, Number(r.ratePerMaund));
  });

  const morningPts = dates.map((d) => morningMap.get(d) ?? null);
  const eveningPts = dates.map((d) => eveningMap.get(d) ?? null);
  const allVals = [...morningPts, ...eveningPts].filter((v): v is number => v !== null);
  if (allVals.length < 2) return null;

  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const W = 100; const H = 60; const PAD = 6;
  const chartH = H - PAD * 2;

  const toY = (v: number) => PAD + chartH - ((v - minV) / range) * chartH;
  const toX = (i: number) => dates.length > 1 ? (i / (dates.length - 1)) * W : W / 2;

  const buildPath = (pts: (number | null)[]) => {
    const segs: string[] = [];
    pts.forEach((v, i) => {
      if (v === null) return;
      const x = toX(i); const y = toY(v);
      const prev = pts.slice(0, i).findLastIndex((p) => p !== null);
      segs.push(prev === -1 ? `M${x},${y}` : `L${x},${y}`);
      if (segs.length === 1 || segs[segs.length - 2]?.startsWith('M')) {
        segs[segs.length - 1] = `M${x},${y}`;
      }
    });
    return segs.join(' ');
  };

  /* simpler approach: filter nulls for each series */
  const mPairs = dates.map((d, i) => ({ x: toX(i), y: morningMap.has(d) ? toY(morningMap.get(d)!) : null }));
  const ePairs = dates.map((d, i) => ({ x: toX(i), y: eveningMap.has(d) ? toY(eveningMap.get(d)!) : null }));

  const toPolyline = (pts: { x: number; y: number | null }[]) =>
    pts.filter((p) => p.y !== null).map((p) => `${p.x},${p.y}`).join(' ');

  const mLine = toPolyline(mPairs);
  const eLine = toPolyline(ePairs);

  const gridVals = [minV, (minV + maxV) / 2, maxV];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-36">
      {/* grid lines */}
      {gridVals.map((v) => (
        <line key={v} x1={0} y1={toY(v)} x2={W} y2={toY(v)}
          stroke="currentColor" strokeWidth={0.3} className="text-gray-200 dark:text-slate-700" strokeDasharray="2,2" />
      ))}
      {/* area fills */}
      {mLine && (
        <polygon
          points={`0,${H} ${mLine} ${W},${H}`}
          className="fill-amber-400" fillOpacity={0.08}
        />
      )}
      {eLine && (
        <polygon
          points={`0,${H} ${eLine} ${W},${H}`}
          className="fill-indigo-400" fillOpacity={0.08}
        />
      )}
      {/* lines */}
      {mLine && (
        <polyline points={mLine} fill="none" stroke="currentColor"
          strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
          className="text-amber-500" />
      )}
      {eLine && (
        <polyline points={eLine} fill="none" stroke="currentColor"
          strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
          className="text-indigo-500" />
      )}
      {/* dots at last points */}
      {mPairs.filter((p) => p.y !== null).slice(-1).map((p) => (
        <circle key="m-last" cx={p.x} cy={p.y!} r={1.5} className="fill-amber-500" />
      ))}
      {ePairs.filter((p) => p.y !== null).slice(-1).map((p) => (
        <circle key="e-last" cx={p.x} cy={p.y!} r={1.5} className="fill-indigo-500" />
      ))}
    </svg>
  );
}

/* ─── Sort icon ─────────────────────────────────────────────────────────── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  const active = col === sortKey;
  return (
    <svg className={`sort-icon ${active ? 'active' : ''}`} viewBox="0 0 16 16" fill="currentColor">
      {sortDir === 'asc' || !active
        ? <path d="M8 4l4 6H4l4-6z" opacity={active && sortDir === 'asc' ? 1 : 0.35} />
        : null}
      {sortDir === 'desc' || !active
        ? <path d="M8 12l-4-6h8l-4 6z" opacity={active && sortDir === 'desc' ? 1 : 0.35} />
        : null}
      {!active && <><path d="M8 4l4 6H4l4-6z" opacity={0.3}/><path d="M8 12l-4-6h8l-4 6z" opacity={0.3}/></>}
    </svg>
  );
}

export default function MarketRatesPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const [rates, setRates] = useState<Rate[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    session: 'MORNING',
    ratePerMaund: '',
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSession, setFilterSession] = useState<'ALL' | 'MORNING' | 'EVENING'>('ALL');
  const [page, setPage] = useState(1);

  const load = () => marketRatesApi.list().then((r) => setRates(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await marketRatesApi.set({ date: form.date, session: form.session, ratePerMaund: Number(form.ratePerMaund) });
      await load();
      setForm((p) => ({ ...p, ratePerMaund: '' }));
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() =>
    filterSession === 'ALL' ? rates : rates.filter((r) => r.session === filterSession),
  [rates, filterSession]);

  const allSorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortKey === 'session') cmp = a.session.localeCompare(b.session);
    else cmp = Number(a.ratePerMaund) - Number(b.ratePerMaund);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(allSorted.length / PAGE_LIMIT);
  const sorted = useMemo(() => allSorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT), [allSorted, page]);

  const morning = rates.filter((r) => r.session === 'MORNING')[0];
  const evening = rates.filter((r) => r.session === 'EVENING')[0];

  const headers: { key: SortKey; label: TranslationKey }[] = [
    { key: 'date',        label: 'date' },
    { key: 'session',     label: 'session' },
    { key: 'ratePerMaund',label: 'ratePKRMun' },
  ];

  return (
    <div className="w-full space-y-5 animate-fadein">
      {/* Set rate modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{t('setMarketRate')}</h3>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mr-date" className="label">{t('date')}</label>
                  <input id="mr-date" type="date" value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label htmlFor="mr-session" className="label">{t('session')}</label>
                  <select id="mr-session" value={form.session}
                    onChange={(e) => setForm((p) => ({ ...p, session: e.target.value }))}
                    className="input">
                    <option value="MORNING">☀ {t('morning')}</option>
                    <option value="EVENING">🌙 {t('evening')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="mr-rate" className="label">{t('ratePKRMun')}</label>
                  <input id="mr-rate" type="number" required value={form.ratePerMaund}
                    placeholder={t('ratePlaceholder')}
                    onChange={(e) => setForm((p) => ({ ...p, ratePerMaund: e.target.value }))}
                    className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t('saving') : t('setRate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('marketRates')}</h1>
          <p className="page-subtitle">{t('rateHistory')}</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} disabled={isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          + {t('setMarketRate')}
        </button>
      </div>

      {/* Latest rate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 card-hover">
          <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2">
            ☀ {t('latestMorningRate')}
          </div>
          <div className="text-3xl font-bold text-amber-800">
            {morning ? `PKR ${fmt2(Number(morning.ratePerMaund))}` : '—'}
          </div>
          {morning && (
            <div className="text-xs text-amber-500 mt-1">
              {new Date(morning.date).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5 card-hover">
          <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-2">
            🌙 {t('latestEveningRate')}
          </div>
          <div className="text-3xl font-bold text-indigo-800">
            {evening ? `PKR ${fmt2(Number(evening.ratePerMaund))}` : '—'}
          </div>
          {evening && (
            <div className="text-xs text-indigo-500 mt-1">
              {new Date(evening.date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      {rates.length >= 2 && (
        <div className="chart-container">
          <div className="flex items-center justify-between mb-3">
            <h2 className="chart-title">{t('marketTrend')}</h2>
            <div className="chart-legend">
              <span className="flex items-center gap-1.5">
                <span className="legend-dot bg-amber-500" />☀ {t('morning')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="legend-dot bg-indigo-500" />🌙 {t('evening')}
              </span>
            </div>
          </div>
          <TrendChart rates={rates} />
        </div>
      )}

      {/* History table */}
      <div className="card overflow-hidden">
        {/* Filter bar */}
        <div className="filter-bar">
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('rateHistory')}</span>
          <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto">
            {(['ALL', 'MORNING', 'EVENING'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setFilterSession(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterSession === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50'
                }`}>
                {s === 'ALL' ? t('all') : s === 'MORNING' ? `☀ ${t('morning')}` : `🌙 ${t('evening')}`}
              </button>
            ))}
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}>
                    <span className="th-sort">
                      {t(label)}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td className="text-gray-700 dark:text-slate-300">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${r.session === 'MORNING' ? 'badge-amber' : 'badge-blue'}`}>
                      {r.session === 'MORNING' ? `☀ ${t('morning')}` : `🌙 ${t('evening')}`}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-900 dark:text-slate-100" dir="ltr">
                    PKR {fmt2(Number(r.ratePerMaund))}
                  </td>
                </tr>
              ))}
              {!sorted.length && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📈</span>
                      <span className="empty-state-text">{t('noRatesYet')}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={allSorted.length} limit={PAGE_LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}
