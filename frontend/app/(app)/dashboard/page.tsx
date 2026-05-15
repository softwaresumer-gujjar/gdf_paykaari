'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';

interface TrendPoint { date: string; collected: number; delivered: number }
interface DashboardData {
  today: string;
  collection: { collected: number; contracted: number; farmerCount: number };
  delivery: { delivered: number; committed: number; retailerCount: number };
  marketRate: { morning: number | null; evening: number | null };
  financials: { totalReceivables: number; receivableCount: number; totalPayables: number; payableCount: number; netPosition: number };
  trend: TrendPoint[];
}

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtPKR = (n: number) => `₨${fmt2(n)}`;

/* ── Icons ──────────────────────────────────────────────────────────────── */
function ExpandIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/* ── Stat Card (Abom style) ─────────────────────────────────────────────── */
function StatCard({
  title, value, sub, icon, badge, href,
}: {
  title: string; value: string; sub: string; icon: string; badge?: string; href?: string;
}) {
  const inner = (
    <div className="card p-4 relative group flex flex-col gap-1.5 h-full">
      {href && (
        <div className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExpandIcon />
        </div>
      )}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[1rem] leading-none">{icon}</span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {title}
        </span>
      </div>
      <div className="text-[1.625rem] font-bold text-gray-900 dark:text-slate-100 leading-none tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[0.75rem] text-gray-500 dark:text-slate-400">{sub}</span>
        {badge && (
          <span className="text-[0.6875rem] font-semibold text-green-600 dark:text-green-400">
            ↑ {badge}
          </span>
        )}
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block card-hover">{inner}</Link>;
  return inner;
}

/* ── Line Chart ─────────────────────────────────────────────────────────── */
function LineChart({ data }: { data: { label: string; a: number; b: number }[] }) {
  if (data.length < 2) return null;
  const W = 100; const H = 64; const PL = 4; const PR = 4; const PB = 10; const PT = 4;
  const cW = W - PL - PR; const cH = H - PB - PT;
  const maxVal = Math.max(...data.flatMap(d => [d.a, d.b]), 1);

  const toPoints = (key: 'a' | 'b') =>
    data.map((d, i) => ({
      x: PL + (i / (data.length - 1)) * cW,
      y: PT + cH - (d[key] / maxVal) * cH,
    }));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const toArea = (pts: { x: number; y: number }[]) =>
    `${toPath(pts)} L${pts.at(-1)!.x.toFixed(1)},${(PT + cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PT + cH).toFixed(1)} Z`;

  const ptsA = toPoints('a'); const ptsB = toPoints('b');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[160px]">
      <defs>
        <linearGradient id="lc-ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="lc-gb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <line key={i} x1={PL} y1={PT + cH * (1 - pct)} x2={W - PR} y2={PT + cH * (1 - pct)}
          stroke="currentColor" strokeWidth="0.3"
          className="text-gray-200 dark:text-slate-700" strokeDasharray="2,2" />
      ))}
      <path d={toArea(ptsA)} fill="url(#lc-ga)" />
      <path d={toArea(ptsB)} fill="url(#lc-gb)" />
      <path d={toPath(ptsA)} fill="none" stroke="#16a34a" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <path d={toPath(ptsB)} fill="none" stroke="#0ea5e9" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={i} x={PL + (i / (data.length - 1)) * cW} y={H - 1.5}
          textAnchor="middle" fontSize={4.5} className="fill-gray-400 dark:fill-slate-600">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

/* ── Spark Line (mini) ──────────────────────────────────────────────────── */
function SparkLine({ data, color, gradId }: { data: number[]; color: string; gradId: string }) {
  if (data.length < 2) return null;
  const w = 100; const h = 36;
  const max = Math.max(...data, 1); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-9 mt-2">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline points={pts.join(' ')} fill="none" strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" stroke={color} />
    </svg>
  );
}

/* ── Progress Bar — colorClass is a Tailwind bg-* class ────────────────── */
function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="progress-bar-bg">
      <div
        className={`progress-bar-fill ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

/* ── Dual Bar ───────────────────────────────────────────────────────────── */
function DualBar({ aAmt, bAmt }: { aAmt: number; bAmt: number }) {
  const max = Math.max(aAmt, bAmt, 1);
  return (
    <div className="space-y-1.5 mt-2">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill bg-teal-400"
          style={{ width: `${(aAmt / max) * 100}%` }} />
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill bg-red-400"
          style={{ width: `${(bAmt / max) * 100}%` }} />
      </div>
    </div>
  );
}

/* ── Period Tabs ────────────────────────────────────────────────────────── */
const PERIODS = ['1D', '1W', '1M', '6M'] as const;
type Period = typeof PERIODS[number];

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t } = useLang();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartPeriod, setChartPeriod] = useState<Period>('1W');

  useEffect(() => {
    dashboardApi.getSummary(selectedDate).then((r) => setData(r.data));
  }, [selectedDate]);

  if (!data) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  const colPct = data.collection.contracted > 0
    ? Math.round((data.collection.collected / data.collection.contracted) * 100) : 0;
  const delPct = data.delivery.committed > 0
    ? Math.round((data.delivery.delivered / data.delivery.committed) * 100) : 0;
  const trend = data.trend ?? [];

  const periodLen: Record<Period, number> = { '1D': 1, '1W': 7, '1M': 7, '6M': 7 };
  const filteredTrend = trend.slice(-periodLen[chartPeriod]);

  const chartData = filteredTrend.map((pt) => {
    const d = new Date(pt.date);
    return { label: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], a: pt.collected, b: pt.delivered };
  });

  const collectedSeries = trend.map((pt) => pt.collected);
  const deliveredSeries = trend.map((pt) => pt.delivered);

  const avgRate =
    data.marketRate.morning != null && data.marketRate.evening != null
      ? Math.round((data.marketRate.morning + data.marketRate.evening) / 2)
      : data.marketRate.morning ?? data.marketRate.evening;

  const fin = data.financials ?? { totalReceivables: 0, receivableCount: 0, totalPayables: 0, payableCount: 0, netPosition: 0 };

  const totalOps = data.collection.collected + data.delivery.delivered;
  const colShare = totalOps > 0 ? Math.round((data.collection.collected / totalOps) * 100) : 0;
  const delShare = totalOps > 0 ? Math.round((data.delivery.delivered / totalOps) * 100) : 0;

  return (
    <div className="w-full space-y-4 animate-fadein">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard')}</h1>
          <p className="page-subtitle">{data.today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            title={t('selectDateLabel')}
            aria-label={t('selectDateLabel')}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-xs py-1.5 max-w-[148px]"
          />
          <Link href="/reports" className="btn btn-secondary text-xs py-1.5 px-3 gap-1.5">
            <ExportIcon /> Export
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('live')}</span>
          </div>
        </div>
      </div>

      {/* ── 6 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title={t('collectedStat')} icon="🥛" badge={`${colPct}%`}
          value={`${data.collection.collected}`}
          sub={`${t('of')} ${data.collection.contracted} ${t('maundsUnit')}`}
          href="/collection"
        />
        <StatCard
          title={t('deliveredStat')} icon="🚚" badge={`${delPct}%`}
          value={`${data.delivery.delivered}`}
          sub={`${t('of')} ${data.delivery.committed} ${t('maundsUnit')}`}
          href="/delivery"
        />
        <StatCard
          title={t('farmers')} icon="👨‍🌾"
          value={String(data.collection.farmerCount)}
          sub={`${data.collection.contracted} ${t('maundsUnit')}/${t('today').toLowerCase()}`}
          href="/farmers"
        />
        <StatCard
          title={t('retailers')} icon="🏪"
          value={String(data.delivery.retailerCount)}
          sub={`${data.delivery.committed} ${t('maundsUnit')}/${t('today').toLowerCase()}`}
          href="/retailers"
        />
        <StatCard
          title={t('receivablesStat')} icon="📥"
          value={fmtPKR(fin.totalReceivables)}
          sub={`${fin.receivableCount} ${t('unpaidLabel')}`}
          href="/billing"
        />
        <StatCard
          title={t('payablesStat')} icon="📤"
          value={fmtPKR(fin.totalPayables)}
          sub={`${fin.payableCount} ${t('unpaidLabel')}`}
          href="/billing"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Trend line chart (2/3) */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="chart-title">{t('trend7Day')} ({t('maundsUnit')})</h2>
            <div className="flex items-center gap-3">
              <div className="chart-legend">
                <span className="flex items-center gap-1.5">
                  <span className="legend-dot bg-green-600" />{t('collectedStat')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="legend-dot bg-sky-400" />{t('deliveredStat')}
                </span>
              </div>
              {/* Period tabs */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                {PERIODS.map((p) => (
                  <button key={p} type="button" onClick={() => setChartPeriod(p)}
                    className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold transition-all ${
                      chartPeriod === p
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                        : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <LineChart data={chartData} />
        </div>

        {/* Operations summary panel (1/3) */}
        <div className="chart-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="chart-title">OPERATIONS</h2>
            <Link href="/market-rates"
              className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium">
              {t('viewMarketRates')}
            </Link>
          </div>

          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100 leading-none">
              {totalOps}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {t('maundsUnit')} total today
            </div>
          </div>

          {/* Collection row */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-slate-300">{t('collectedStat')}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-slate-100">{data.collection.collected}</span>
                <span className="text-[0.6875rem] font-semibold text-green-600 dark:text-green-400">{colShare}%</span>
              </div>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill bg-green-600"
                style={{ width: `${colShare}%` }} />
            </div>
          </div>

          {/* Delivery row */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-slate-300">{t('deliveredStat')}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-slate-100">{data.delivery.delivered}</span>
                <span className="text-[0.6875rem] font-semibold text-sky-500 dark:text-sky-400">{delShare}%</span>
              </div>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill bg-sky-400"
                style={{ width: `${delShare}%` }} />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
            <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {t('marketRates')} ({t('perMaund')})
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/20 text-center">
                <div className="text-[0.6875rem] text-amber-600 font-medium mb-0.5">☀ {t('morning')}</div>
                <div className="text-base font-bold text-amber-800 dark:text-amber-400">
                  {data.marketRate.morning != null ? data.marketRate.morning.toLocaleString() : '—'}
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-2.5 border border-indigo-100 dark:border-indigo-800/20 text-center">
                <div className="text-[0.6875rem] text-indigo-600 font-medium mb-0.5">🌙 {t('evening')}</div>
                <div className="text-base font-bold text-indigo-800 dark:text-indigo-400">
                  {data.marketRate.evening != null ? data.marketRate.evening.toLocaleString() : '—'}
                </div>
              </div>
            </div>
            {avgRate != null && (
              <div className="text-[0.6875rem] text-gray-400 text-center mt-1.5">
                {t('avgRate')}: PKR {avgRate.toLocaleString()}/{t('maundsUnit')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Collection progress sparkline */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('collectionProgress')}</span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">{colPct}%</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400 leading-none">
            {data.collection.collected}{' '}
            <span className="text-sm font-normal text-gray-400">{t('maundsUnit')}</span>
          </div>
          <ProgressBar pct={colPct} colorClass="bg-green-600" />
          <div className="text-xs text-gray-400 mt-1 mb-1">
            {t('of')} {data.collection.contracted} {t('contractedLabel')}
          </div>
          <SparkLine data={collectedSeries} color="#16a34a" gradId="grad-col" />
        </div>

        {/* Delivery progress sparkline */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('deliveryProgress')}</span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{delPct}%</span>
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-500 leading-none">
            {data.delivery.delivered}{' '}
            <span className="text-sm font-normal text-gray-400">{t('maundsUnit')}</span>
          </div>
          <ProgressBar pct={delPct} colorClass="bg-sky-400" />
          <div className="text-xs text-gray-400 mt-1 mb-1">
            {t('of')} {data.delivery.committed} {t('committedLabel')}
          </div>
          <SparkLine data={deliveredSeries} color="#0ea5e9" gradId="grad-del" />
        </div>

        {/* Today's balance */}
        <div className="chart-container">
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 block mb-1">
            {t('todayBalance')}
          </span>
          <div className={`text-2xl font-bold mb-0.5 leading-none ${
            (data.collection.collected - data.delivery.delivered) >= 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {data.collection.collected - data.delivery.delivered}{' '}
            <span className="text-sm font-normal text-gray-400">{t('maundsUnit')}</span>
          </div>
          <div className="text-xs text-gray-400">{t('collectedMinusDelivered')}</div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('netFinancial')}</span>
              <span className={`font-bold ${fin.netPosition >= 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'}`}>
                {fmtPKR(Math.abs(fin.netPosition))} {fin.netPosition >= 0 ? '↑' : '↓'}
              </span>
            </div>
          </div>
        </div>

        {/* Receivables / Payables */}
        <div className="chart-container">
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 block mb-2">
            {t('outstandingAllTime')}
          </span>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-teal-600 font-medium">📥 {t('receivablesStat')}</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">{fmtPKR(fin.totalReceivables)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-500 font-medium">📤 {t('payablesStat')}</span>
              <span className="font-bold text-red-600 dark:text-red-400">{fmtPKR(fin.totalPayables)}</span>
            </div>
            <DualBar aAmt={fin.totalReceivables} bAmt={fin.totalPayables} />
            <div className="pt-1.5 border-t border-gray-100 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-gray-500">{t('net')}</span>
              <span className={`font-bold ${fin.netPosition >= 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'}`}>
                {fmtPKR(fin.netPosition)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
