'use client';

import { useEffect, useState } from 'react';
import { reportsApi, orgSettingsApi, farmersApi } from '@/lib/api';
import { useSubscription } from '@/lib/subscription-context';
import { downloadReportPDF, type OrgSettings } from '@/lib/pdf';
import { downloadCollectionExcel, downloadDeliveryExcel } from '@/lib/excel';

type ReportKey =
  | 'collection-morning'
  | 'collection-evening'
  | 'collection-combined'
  | 'delivery-morning'
  | 'delivery-evening'
  | 'delivery-combined'
  | 'quality'
  | 'payments'
  | 'receivables'
  | 'balance';

const REPORT_TABS: { key: ReportKey; label: string; icon: string; group: string }[] = [
  { key: 'collection-morning',  label: 'Morning Collection',  icon: '☀',   group: 'Collection' },
  { key: 'collection-evening',  label: 'Evening Collection',  icon: '🌙',   group: 'Collection' },
  { key: 'collection-combined', label: 'Combined Collection', icon: '🥛',   group: 'Collection' },
  { key: 'delivery-morning',    label: 'Morning Delivery',    icon: '🚚☀',  group: 'Delivery' },
  { key: 'delivery-evening',    label: 'Evening Delivery',    icon: '🚚🌙', group: 'Delivery' },
  { key: 'delivery-combined',   label: 'Combined Delivery',   icon: '🚛',   group: 'Delivery' },
  { key: 'quality',             label: 'Milk Quality',        icon: '🧪',   group: 'Quality' },
  { key: 'payments',            label: 'Payments Report',     icon: '💳',   group: 'Finance' },
  { key: 'receivables',         label: 'Receivables & Payables', icon: '⚖️', group: 'Finance' },
  { key: 'balance',             label: 'Balance Report',      icon: '📊',   group: 'Finance' },
];

interface CollectionEntry {
  id: string; date: string; session: string;
  farmer: { name: string }; collectedMaunds: number;
  qualityPassed: boolean; qualityFatPercent?: number; qualityWaterAdded: boolean;
}
interface DeliveryEntry {
  id: string; date: string; session: string;
  retailer: { name: string }; deliveredMaunds: number;
}
interface QualityEntry {
  id: string; date: string; session: string; farmer: { name: string };
  collectedMaunds: number; qualityPassed: boolean;
  qualityFatPercent?: number | null; qualityWaterAdded: boolean; qualityDensity?: number | null; qualityNotes?: string | null;
}
interface QualityByFarmer { farmerId: string; name: string; total: number; passed: number; failed: number; passRate: number; avgFat: number | null; waterAdded: number }
interface QualityData {
  entries: QualityEntry[];
  summary: { total: number; passed: number; failed: number; passRate: number; avgFat: number | null; waterAdded: number };
  byFarmer: QualityByFarmer[];
}
interface CollectionData { entries: CollectionEntry[]; summary: { totalMuns: number; totalEntries: number } }
interface DeliveryData { entries: DeliveryEntry[]; summary: { totalMuns: number; totalEntries: number } }
interface BalanceData {
  collection: { totalMuns: number };
  delivery: { totalMuns: number };
  balance: { muns: number };
  payables: { amount: number; count: number };
  receivables: { amount: number; count: number };
}
interface PaymentRow { id: string; date: string | null; party: string; amount: number; paymentMode: string | null; reference: string | null; type: string; source: string; notes?: string | null }
interface PaymentsData {
  farmerPayments: PaymentRow[];
  retailerPayments: PaymentRow[];
  manualPayments: PaymentRow[];
  summary: { totalOutgoing: number; totalIncoming: number; net: number };
}
interface ReceivablesData {
  receivables: { id: string; date: string; retailer: string; amount: number; daysOutstanding: number }[];
  payables: { id: string; date: string; farmer: string; amount: number; daysOutstanding: number }[];
  summary: {
    totalReceivables: number; totalPayables: number; net: number;
    receivableAging: Record<string, number>;
    payableAging: Record<string, number>;
  };
}

interface Farmer { id: string; name: string }

type ReportData = CollectionData | DeliveryData | QualityData | BalanceData | PaymentsData | ReceivablesData | null;

const GROUPS = ['Collection', 'Delivery', 'Quality', 'Finance'];

function AgeBar({ val, max, color }: { val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <svg viewBox="0 0 100 6" className="w-full h-1.5 mt-0.5">
      <rect x={0} y={0} width={100} height={6} rx={3} className="fill-gray-100" />
      <rect x={0} y={0} width={pct} height={6} rx={3} className={color} />
    </svg>
  );
}

export default function ReportsPage() {
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  const [activeTab, setActiveTab] = useState<ReportKey>('collection-morning');
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [farmerId, setFarmerId] = useState('');
  const [data, setData] = useState<ReportData>(null);
  const [loading, setLoading] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>({});
  const [farmers, setFarmers] = useState<Farmer[]>([]);

  useEffect(() => {
    orgSettingsApi.get().then((r) => setOrgSettings(r.data)).catch(() => {});
    farmersApi.list().then((r) => setFarmers(r.data));
  }, []);

  const run = async () => {
    setLoading(true);
    setData(null);
    try {
      if (activeTab === 'collection-morning') {
        const r = await reportsApi.collection(dateFrom, dateTo, 'MORNING');
        setData(r.data);
      } else if (activeTab === 'collection-evening') {
        const r = await reportsApi.collection(dateFrom, dateTo, 'EVENING');
        setData(r.data);
      } else if (activeTab === 'collection-combined') {
        const r = await reportsApi.collection(dateFrom, dateTo);
        setData(r.data);
      } else if (activeTab === 'delivery-morning') {
        const r = await reportsApi.delivery(dateFrom, dateTo, 'MORNING');
        setData(r.data);
      } else if (activeTab === 'delivery-evening') {
        const r = await reportsApi.delivery(dateFrom, dateTo, 'EVENING');
        setData(r.data);
      } else if (activeTab === 'delivery-combined') {
        const r = await reportsApi.delivery(dateFrom, dateTo);
        setData(r.data);
      } else if (activeTab === 'quality') {
        const r = await reportsApi.quality(dateFrom, dateTo, farmerId || undefined);
        setData(r.data);
      } else if (activeTab === 'payments') {
        const r = await reportsApi.payments(dateFrom, dateTo);
        setData(r.data);
      } else if (activeTab === 'receivables') {
        const r = await reportsApi.receivables();
        setData(r.data);
      } else {
        const r = await reportsApi.balance(dateFrom, dateTo);
        setData(r.data);
      }
    } finally { setLoading(false); }
  };

  const isCollection = activeTab.startsWith('collection');
  const isDelivery = activeTab.startsWith('delivery');
  const isQuality = activeTab === 'quality';
  const isPayments = activeTab === 'payments';
  const isReceivables = activeTab === 'receivables';
  const isBalance = activeTab === 'balance';
  const tab = REPORT_TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left nav — grouped */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {GROUPS.map((group) => {
              const items = REPORT_TABS.filter((t) => t.group === group);
              return (
                <div key={group}>
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{group}</span>
                  </div>
                  {items.map((t) => (
                    <button key={t.key} type="button"
                      onClick={() => { setActiveTab(t.key); setData(null); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left border-b border-gray-100 last:border-0 transition-colors ${activeTab === t.key ? 'bg-blue-50 text-blue-700 border-l-2 border-l-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Report panel */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
            {activeTab !== 'receivables' && (
              <>
                <div>
                  <label htmlFor="rpt-from" className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input id="rpt-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label htmlFor="rpt-to" className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input id="rpt-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
              </>
            )}
            {isQuality && (
              <div>
                <label htmlFor="rpt-farmer" className="block text-xs font-medium text-gray-500 mb-1">Farmer</label>
                <select id="rpt-farmer" value={farmerId} onChange={(e) => setFarmerId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">All Farmers</option>
                  {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            <button type="button" onClick={run} disabled={loading}
              className="bg-blue-600 text-white px-5 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Running…' : 'Run Report'}
            </button>
            {data && (isCollection || isDelivery) && (
              <>
                <button type="button"
                  onClick={() => {
                    const dr = `${dateFrom} to ${dateTo}`;
                    if (isCollection) downloadCollectionExcel((data as CollectionData).entries, dr);
                    else downloadDeliveryExcel((data as DeliveryData).entries, dr);
                  }}
                  disabled={isReadonly}
                  className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Excel ↓
                </button>
                <button type="button"
                  onClick={() => {
                    const dr = `${dateFrom} to ${dateTo}`;
                    const label = tab.label;
                    if (isCollection) {
                      const cd = data as CollectionData;
                      downloadReportPDF(label, dr,
                        ['Date', 'Farmer', 'Muns', 'Session', 'Fat %', 'Quality'],
                        cd.entries.map((e) => [new Date(e.date).toLocaleDateString(), e.farmer.name, Number(e.collectedMaunds), e.session, e.qualityFatPercent != null ? `${e.qualityFatPercent}%` : '—', e.qualityPassed ? 'Passed' : 'Failed']),
                        { 'Total Muns': cd.summary.totalMuns, 'Entries': cd.summary.totalEntries },
                        orgSettings,
                      );
                    } else {
                      const dd = data as DeliveryData;
                      downloadReportPDF(label, dr,
                        ['Date', 'Retailer', 'Muns', 'Session'],
                        dd.entries.map((e) => [new Date(e.date).toLocaleDateString(), e.retailer.name, Number(e.deliveredMaunds), e.session]),
                        { 'Total Muns': dd.summary.totalMuns, 'Entries': dd.summary.totalEntries },
                        orgSettings,
                      );
                    }
                  }}
                  disabled={isReadonly}
                  className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  PDF ↓
                </button>
              </>
            )}
          </div>

          {!data && !loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
              <div className="text-5xl mb-3">{tab.icon}</div>
              <div className="text-gray-400 text-sm font-medium">{tab.label}</div>
              <div className="text-gray-300 text-xs mt-1">Select date range and click Run Report</div>
            </div>
          )}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-14 text-center text-gray-400 text-sm animate-pulse">
              Running report…
            </div>
          )}

          {/* ── Collection / Delivery table ── */}
          {(isCollection || isDelivery) && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Total Muns</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isCollection ? (data as CollectionData).summary.totalMuns : (data as DeliveryData).summary.totalMuns}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Entries</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isCollection ? (data as CollectionData).summary.totalEntries : (data as DeliveryData).summary.totalEntries}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      {isCollection
                        ? ['Date', 'Session', 'Farmer', 'Muns', 'Fat %', 'Quality'].map((h) => <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>)
                        : ['Date', 'Session', 'Retailer', 'Muns Delivered'].map((h) => <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>)
                      }
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isCollection && (data as CollectionData).entries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${e.session === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{e.session}</span></td>
                        <td className="px-4 py-3 font-medium">{e.farmer.name}</td>
                        <td className="px-4 py-3">{Number(e.collectedMaunds)}</td>
                        <td className="px-4 py-3">{e.qualityFatPercent != null ? `${e.qualityFatPercent}%` : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${e.qualityPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.qualityPassed ? 'Passed' : 'Failed'}</span></td>
                      </tr>
                    ))}
                    {isDelivery && (data as DeliveryData).entries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${e.session === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{e.session}</span></td>
                        <td className="px-4 py-3 font-medium">{e.retailer.name}</td>
                        <td className="px-4 py-3">{Number(e.deliveredMaunds)}</td>
                      </tr>
                    ))}
                    {((isCollection && !(data as CollectionData).entries.length) || (isDelivery && !(data as DeliveryData).entries.length)) && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Quality Report ── */}
          {isQuality && data && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Entries', value: String((data as QualityData).summary.total), color: 'text-gray-800' },
                  { label: 'Passed', value: `${(data as QualityData).summary.passed} (${(data as QualityData).summary.passRate}%)`, color: 'text-green-700' },
                  { label: 'Failed', value: String((data as QualityData).summary.failed), color: 'text-red-600' },
                  { label: 'Avg Fat %', value: (data as QualityData).summary.avgFat != null ? `${(data as QualityData).summary.avgFat}%` : '—', color: 'text-blue-700' },
                ].map((c) => (
                  <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">{c.label}</div>
                    <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Per-farmer quality table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Quality by Farmer</div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      {['Farmer', 'Total', 'Passed', 'Failed', 'Pass Rate', 'Avg Fat %', 'Water Added'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data as QualityData).byFarmer.map((f) => (
                      <tr key={f.farmerId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{f.name}</td>
                        <td className="px-4 py-3">{f.total}</td>
                        <td className="px-4 py-3 text-green-600">{f.passed}</td>
                        <td className="px-4 py-3 text-red-500">{f.failed}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${f.passRate >= 80 ? 'text-green-700' : f.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{f.passRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{f.avgFat != null ? `${f.avgFat}%` : '—'}</td>
                        <td className="px-4 py-3">
                          {f.waterAdded > 0
                            ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{f.waterAdded} ⚠</span>
                            : <span className="text-gray-400">None</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {!(data as QualityData).byFarmer.length && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Detailed entries */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Detailed Entries</div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      {['Date', 'Session', 'Farmer', 'Muns', 'Fat %', 'Density', 'Water Added', 'Quality', 'Notes'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data as QualityData).entries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${e.session === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{e.session}</span></td>
                        <td className="px-3 py-2.5 font-medium">{e.farmer.name}</td>
                        <td className="px-3 py-2.5">{Number(e.collectedMaunds)}</td>
                        <td className="px-3 py-2.5">{e.qualityFatPercent != null ? `${e.qualityFatPercent}%` : '—'}</td>
                        <td className="px-3 py-2.5">{e.qualityDensity != null ? e.qualityDensity : '—'}</td>
                        <td className="px-3 py-2.5">{e.qualityWaterAdded ? <span className="text-red-600 font-medium">Yes ⚠</span> : <span className="text-green-600">No</span>}</td>
                        <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${e.qualityPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.qualityPassed ? 'Passed' : 'Failed'}</span></td>
                        <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate">{e.qualityNotes ?? '—'}</td>
                      </tr>
                    ))}
                    {!(data as QualityData).entries.length && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Payments Report ── */}
          {isPayments && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: '📥 Total Incoming', value: `₨${(data as PaymentsData).summary.totalIncoming.toLocaleString()}`, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
                  { label: '📤 Total Outgoing', value: `₨${(data as PaymentsData).summary.totalOutgoing.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                  { label: '⚖️ Net',            value: `₨${(data as PaymentsData).summary.net.toLocaleString()}`, color: (data as PaymentsData).summary.net >= 0 ? 'text-green-700' : 'text-amber-700', bg: 'bg-white border-gray-200' },
                ].map((c) => (
                  <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
                    <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                    <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              {[
                { title: '📥 Retailer Collections (Invoice Payments)', rows: (data as PaymentsData).retailerPayments },
                { title: '📤 Farmer Payouts (Invoice Payments)', rows: (data as PaymentsData).farmerPayments },
                { title: '🔖 Manual Payments', rows: (data as PaymentsData).manualPayments },
              ].map(({ title, rows }) => rows.length > 0 && (
                <div key={title} className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">{title}</div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        {['Date', 'Party', 'Amount (PKR)', 'Mode', 'Reference', 'Direction'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 font-medium">{r.party}</td>
                          <td className="px-4 py-3 font-semibold">{Number(r.amount).toLocaleString()}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{r.paymentMode?.replace('_', ' ') ?? '—'}</span></td>
                          <td className="px-4 py-3 text-gray-400">{r.reference ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.type === 'INCOMING' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                              {r.type === 'INCOMING' ? '📥 In' : '📤 Out'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ── Receivables / Payables ── */}
          {isReceivables && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: '📥 Receivables', value: `₨${(data as ReceivablesData).summary.totalReceivables.toLocaleString()}`, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
                  { label: '📤 Payables', value: `₨${(data as ReceivablesData).summary.totalPayables.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                  { label: '⚖️ Net Position', value: `₨${(data as ReceivablesData).summary.net.toLocaleString()}`, color: (data as ReceivablesData).summary.net >= 0 ? 'text-green-700' : 'text-amber-700', bg: 'bg-white border-gray-200' },
                ].map((c) => (
                  <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
                    <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                    <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              {/* Aging buckets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: '📥 Receivable Aging', aging: (data as ReceivablesData).summary.receivableAging, color: 'fill-teal-400' },
                  { title: '📤 Payable Aging', aging: (data as ReceivablesData).summary.payableAging, color: 'fill-red-400' },
                ].map(({ title, aging, color }) => {
                  const total = Object.values(aging).reduce((s, v) => s + v, 0) || 1;
                  return (
                    <div key={title} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="font-semibold text-sm text-gray-800 mb-3">{title}</div>
                      {[['0-30 days', 'current'], ['31-60 days', 'over30'], ['61-90 days', 'over60'], ['90+ days', 'over90']].map(([label, key]) => (
                        <div key={key} className="mb-2">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-semibold">₨{(aging[key] ?? 0).toLocaleString()}</span>
                          </div>
                          <AgeBar val={aging[key] ?? 0} max={total} color={color} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {/* Receivables table */}
              {(() => {
                const thead = ['Name', 'Invoice Date', 'Amount (PKR)', 'Days Outstanding'];
                function AgeTag({ days }: { days: number }) {
                  const cls = days > 90 ? 'bg-red-100 text-red-700' : days > 60 ? 'bg-orange-100 text-orange-700' : days > 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
                  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{days}d</span>;
                }
                return (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">📥 Outstanding Retailer Receivables</div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>{thead.map((h) => <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(data as ReceivablesData).receivables.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{r.retailer}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-semibold">{Number(r.amount).toLocaleString()}</td>
                              <td className="px-4 py-3"><AgeTag days={r.daysOutstanding} /></td>
                            </tr>
                          ))}
                          {!(data as ReceivablesData).receivables.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No outstanding items.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">📤 Outstanding Farmer Payables</div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>{thead.map((h) => <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(data as ReceivablesData).payables.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{r.farmer}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-semibold">{Number(r.amount).toLocaleString()}</td>
                              <td className="px-4 py-3"><AgeTag days={r.daysOutstanding} /></td>
                            </tr>
                          ))}
                          {!(data as ReceivablesData).payables.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No outstanding items.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Balance Report ── */}
          {isBalance && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: '🥛 Total Collected', value: `${(data as BalanceData).collection.totalMuns} Muns`, color: 'blue' },
                { label: '🚚 Total Delivered', value: `${(data as BalanceData).delivery.totalMuns} Muns`, color: 'green' },
                { label: '⚖️ Balance (Col − Del)', value: `${(data as BalanceData).balance.muns} Muns`, color: (data as BalanceData).balance.muns >= 0 ? 'green' : 'red' },
                { label: '📤 Unpaid Farmer Payables', value: `₨${(data as BalanceData).payables.amount.toLocaleString()} (${(data as BalanceData).payables.count})`, color: 'red' },
                { label: '📥 Unpaid Retailer Receivables', value: `₨${(data as BalanceData).receivables.amount.toLocaleString()} (${(data as BalanceData).receivables.count})`, color: 'amber' },
                { label: '💰 Net Receivable Position', value: `₨${((data as BalanceData).receivables.amount - (data as BalanceData).payables.amount).toLocaleString()}`, color: 'gray' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                  <div className={`text-lg font-bold ${card.color === 'blue' ? 'text-blue-700' : card.color === 'green' ? 'text-green-700' : card.color === 'red' ? 'text-red-600' : card.color === 'amber' ? 'text-amber-700' : 'text-gray-800'}`}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
