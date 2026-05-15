'use client';

import { useEffect, useMemo, useState } from 'react';
import { billingApi, farmersApi, retailersApi, orgSettingsApi } from '@/lib/api';
import { useSubscription } from '@/lib/subscription-context';
import { downloadFarmerInvoicePDF, downloadRetailerInvoicePDF, type OrgSettings } from '@/lib/pdf';
import { downloadFarmerInvoicesExcel, downloadRetailerInvoicesExcel } from '@/lib/excel';
import { useLang } from '@/lib/language-context';
import { Pagination } from '@/components/pagination';

interface FarmerInvoice {
  id: string; farmer: { name: string; phone?: string }; date: string;
  suppliedMaunds: number; contractedMaunds: number; fixedRate: number; marketRate: number;
  baseAmount: number; shortfallPenalty: number; excessBonus: number; netAmount: number;
  isPaid: boolean; paidAt?: string; paymentMode?: string; paymentReference?: string;
}
interface RetailerInvoice {
  id: string; retailer: { name: string; phone?: string }; date: string;
  purchasedMaunds: number; committedMaunds: number; fixedRate: number; marketRate: number;
  baseAmount: number; excessSurcharge: number; netAmount: number;
  isPaid: boolean; paidAt?: string; paymentMode?: string; paymentReference?: string;
}
interface Farmer { id: string; name: string }
interface Retailer { id: string; name: string }
interface PageMeta { total: number; totalPages: number; page: number; limit: number }

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'GIFT', 'OTHER'];
const PAGE_LIMIT = 50;

type FSortKey = 'farmer' | 'date' | 'netAmount' | 'status';
type RSortKey = 'retailer' | 'date' | 'netAmount' | 'status';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`sort-icon ${active ? 'active' : ''}`} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4l4 6H4l4-6z"     opacity={active && dir === 'asc'  ? 1 : 0.3} />
      <path d="M8 12l-4-6h8l-4 6z" opacity={active && dir === 'desc' ? 1 : 0.3} />
    </svg>
  );
}

function PayModal({ onConfirm, onCancel, t }: {
  onConfirm: (mode: string, ref: string) => void;
  onCancel: () => void;
  t: (k: string) => string;
}) {
  const [mode, setMode] = useState('CASH');
  const [ref, setRef] = useState('');
  const modeLabels: Record<string, string> = {
    CASH: `💵 ${t('cash')}`, CHEQUE: `📃 ${t('cheque')}`,
    BANK_TRANSFER: `🏦 ${t('bankTransfer')}`, ONLINE: `💻 ${t('online')}`,
    GIFT: '🎁 Gift', OTHER: '📦 Other',
  };
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('markAsPaid')}</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div>
            <label htmlFor="pay-mode" className="label">{t('paymentMode')}</label>
            <select id="pay-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input">
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{modeLabels[m] ?? m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pay-ref" className="label">{t('paymentRef')}</label>
            <input id="pay-ref" value={ref} onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. CHQ-1234" className="input" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onCancel} className="btn btn-secondary">{t('cancel')}</button>
          <button type="button" onClick={() => onConfirm(mode, ref)} className="btn btn-primary">{t('confirm')}</button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  const [tab, setTab] = useState<'farmers' | 'retailers'>('farmers');
  const [farmerInvoices, setFarmerInvoices] = useState<FarmerInvoice[]>([]);
  const [retailerInvoices, setRetailerInvoices] = useState<RetailerInvoice[]>([]);
  const [fMeta, setFMeta] = useState<PageMeta>({ total: 0, totalPages: 1, page: 1, limit: PAGE_LIMIT });
  const [rMeta, setRMeta] = useState<PageMeta>({ total: 0, totalPages: 1, page: 1, limit: PAGE_LIMIT });
  const [fPage, setFPage] = useState(1);
  const [rPage, setRPage] = useState(1);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [genDate, setGenDate] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>({});

  const [fFarmerId, setFFarmerId] = useState('');
  const [fRetailerId, setFRetailerId] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPayMode, setFPayMode] = useState('');
  const [fDateFrom, setFDateFrom] = useState(monthStart);
  const [fDateTo, setFDateTo] = useState(today);

  const [fSortKey, setFSortKey] = useState<FSortKey>('date');
  const [fSortDir, setFSortDir] = useState<SortDir>('desc');
  const [rSortKey, setRSortKey] = useState<RSortKey>('date');
  const [rSortDir, setRSortDir] = useState<SortDir>('desc');

  const [payTarget, setPayTarget] = useState<{ id: string; type: 'farmer' | 'retailer' } | null>(null);

  const loadFarmer = (pg = fPage) =>
    billingApi.farmerInvoices(fFarmerId || undefined, fStatus || undefined, fDateFrom, fDateTo, fPayMode || undefined, pg, PAGE_LIMIT)
      .then((r) => {
        const d = r.data;
        setFarmerInvoices(d.items ?? []);
        setFMeta({ total: d.total, totalPages: d.totalPages, page: d.page, limit: d.limit });
      });
  const loadRetailer = (pg = rPage) =>
    billingApi.retailerInvoices(fRetailerId || undefined, fStatus || undefined, fDateFrom, fDateTo, fPayMode || undefined, pg, PAGE_LIMIT)
      .then((r) => {
        const d = r.data;
        setRetailerInvoices(d.items ?? []);
        setRMeta({ total: d.total, totalPages: d.totalPages, page: d.page, limit: d.limit });
      });

  useEffect(() => {
    farmersApi.list().then((r) => setFarmers(r.data));
    retailersApi.list().then((r) => setRetailers(r.data));
    orgSettingsApi.get().then((r) => setOrgSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => { setFPage(1); loadFarmer(1); }, [fFarmerId, fStatus, fPayMode, fDateFrom, fDateTo]);
  useEffect(() => { setRPage(1); loadRetailer(1); }, [fRetailerId, fStatus, fPayMode, fDateFrom, fDateTo]);
  useEffect(() => { loadFarmer(fPage); }, [fPage]);
  useEffect(() => { loadRetailer(rPage); }, [rPage]);

  const generate = async () => {
    setGenerating(true);
    try {
      await Promise.all([billingApi.generateFarmerInvoices(genDate), billingApi.generateRetailerInvoices(genDate)]);
      setFPage(1); setRPage(1);
      await Promise.all([loadFarmer(1), loadRetailer(1)]);
    } finally { setGenerating(false); }
  };

  const handleMarkPaid = async (mode: string, ref: string) => {
    if (!payTarget) return;
    if (payTarget.type === 'farmer') {
      await billingApi.markFarmerPaid(payTarget.id, mode, ref);
      await loadFarmer(fPage);
    } else {
      await billingApi.markRetailerPaid(payTarget.id, mode, ref);
      await loadRetailer(rPage);
    }
    setPayTarget(null);
  };

  const toggleFSort = (key: FSortKey) => {
    if (fSortKey === key) setFSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setFSortKey(key); setFSortDir('asc'); }
  };
  const toggleRSort = (key: RSortKey) => {
    if (rSortKey === key) setRSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setRSortKey(key); setRSortDir('asc'); }
  };

  const sortedFarmer = useMemo(() => [...farmerInvoices].sort((a, b) => {
    let cmp = 0;
    if (fSortKey === 'farmer') cmp = a.farmer.name.localeCompare(b.farmer.name);
    else if (fSortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (fSortKey === 'netAmount') cmp = Number(a.netAmount) - Number(b.netAmount);
    else cmp = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
    return fSortDir === 'asc' ? cmp : -cmp;
  }), [farmerInvoices, fSortKey, fSortDir]);

  const sortedRetailer = useMemo(() => [...retailerInvoices].sort((a, b) => {
    let cmp = 0;
    if (rSortKey === 'retailer') cmp = a.retailer.name.localeCompare(b.retailer.name);
    else if (rSortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (rSortKey === 'netAmount') cmp = Number(a.netAmount) - Number(b.netAmount);
    else cmp = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
    return rSortDir === 'asc' ? cmp : -cmp;
  }), [retailerInvoices, rSortKey, rSortDir]);

  const farmerTotal = farmerInvoices.reduce((s, i) => s + Number(i.netAmount), 0);
  const farmerPaid = farmerInvoices.filter((i) => i.isPaid).reduce((s, i) => s + Number(i.netAmount), 0);
  const retailerTotal = retailerInvoices.reduce((s, i) => s + Number(i.netAmount), 0);
  const retailerPaid = retailerInvoices.filter((i) => i.isPaid).reduce((s, i) => s + Number(i.netAmount), 0);

  const modeLabels: Record<string, string> = {
    CASH: `💵 ${t('cash')}`, CHEQUE: `📃 ${t('cheque')}`,
    BANK_TRANSFER: `🏦 ${t('bankTransfer')}`, ONLINE: `💻 ${t('online')}`,
    GIFT: '🎁 Gift', OTHER: '📦 Other',
  };

  const Filters = () => (
    <div className="filter-bar flex-wrap gap-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label htmlFor="f-date-from" className="label">{t('from')}</label>
          <input id="f-date-from" type="date" value={fDateFrom} onChange={(e) => setFDateFrom(e.target.value)} className="input !w-auto" />
        </div>
        <div>
          <label htmlFor="f-date-to" className="label">{t('to')}</label>
          <input id="f-date-to" type="date" value={fDateTo} onChange={(e) => setFDateTo(e.target.value)} className="input !w-auto" />
        </div>
        {tab === 'farmers' ? (
          <div>
            <label htmlFor="f-farmer" className="label">{t('farmer')}</label>
            <select id="f-farmer" value={fFarmerId} onChange={(e) => setFFarmerId(e.target.value)} className="input !w-auto">
              <option value="">{t('allFarmers')}</option>
              {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="f-retailer" className="label">{t('retailer')}</label>
            <select id="f-retailer" value={fRetailerId} onChange={(e) => setFRetailerId(e.target.value)} className="input !w-auto">
              <option value="">{t('allRetailers')}</option>
              {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="f-status" className="label">{t('invoiceStatus')}</label>
          <select id="f-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="input !w-auto">
            <option value="">{t('all')}</option>
            <option value="false">{t('unpaidInvoices')}</option>
            <option value="true">{t('paidInvoices')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-paymode" className="label">{t('paymentMode')}</label>
          <select id="f-paymode" value={fPayMode} onChange={(e) => setFPayMode(e.target.value)} className="input !w-auto">
            <option value="">{t('allModes')}</option>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{modeLabels[m] ?? m.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 animate-fadein">
      {payTarget && <PayModal onConfirm={handleMarkPaid} onCancel={() => setPayTarget(null)} t={t} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('billing')}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button"
            onClick={() => tab === 'farmers' ? downloadFarmerInvoicesExcel(farmerInvoices) : downloadRetailerInvoicesExcel(retailerInvoices)}
            disabled={isReadonly}
            className="btn btn-secondary gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
            ⬇ {t('exportExcel')}
          </button>
          <input id="gen-date" type="date" value={genDate} onChange={(e) => setGenDate(e.target.value)}
            title={t('invoiceDate')} className="input !w-auto" />
          <button type="button" onClick={generate} disabled={generating || isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {generating ? t('generating') : t('generateInvoice')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-group w-fit">
        <button type="button" onClick={() => setTab('farmers')} className={`tab-btn ${tab === 'farmers' ? 'active' : ''}`}>
          🌾 {t('farmerInvoices')}
        </button>
        <button type="button" onClick={() => setTab('retailers')} className={`tab-btn ${tab === 'retailers' ? 'active' : ''}`}>
          🏪 {t('retailerInvoices')}
        </button>
      </div>

      <Filters />

      {/* Summary strip */}
      {tab === 'farmers' && fMeta.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3">
            <div className="text-xs text-[var(--text-3)]">{t('totalInvoices')}</div>
            <div className="text-lg font-bold text-[var(--text-1)]">{fMeta.total}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-[var(--text-3)]">{t('totalBilled')}</div>
            <div className="text-lg font-bold text-[var(--text-1)]">₨{fmt2(farmerTotal)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/40 p-3">
            <div className="text-xs text-green-600">{t('paidInvoices')}</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">₨{fmt2(farmerPaid)}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40 p-3">
            <div className="text-xs text-amber-600">{t('totalOutstanding')}</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-400">₨{fmt2(farmerTotal - farmerPaid)}</div>
          </div>
        </div>
      )}
      {tab === 'retailers' && rMeta.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3">
            <div className="text-xs text-[var(--text-3)]">{t('totalInvoices')}</div>
            <div className="text-lg font-bold text-[var(--text-1)]">{rMeta.total}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-[var(--text-3)]">{t('totalBilled')}</div>
            <div className="text-lg font-bold text-[var(--text-1)]">₨{fmt2(retailerTotal)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/40 p-3">
            <div className="text-xs text-green-600">{t('collectedPaid')}</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">₨{fmt2(retailerPaid)}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40 p-3">
            <div className="text-xs text-amber-600">{t('totalOutstanding')}</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-400">₨{fmt2(retailerTotal - retailerPaid)}</div>
          </div>
        </div>
      )}

      {/* Farmer invoices table */}
      {tab === 'farmers' && (
        <div className="card overflow-hidden">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleFSort('farmer')}><span className="th-sort">{t('farmer')}<SortIcon active={fSortKey==='farmer'} dir={fSortDir}/></span></th>
                  <th onClick={() => toggleFSort('date')}><span className="th-sort">{t('date')}<SortIcon active={fSortKey==='date'} dir={fSortDir}/></span></th>
                  <th>{t('maunds')} ({t('maundsUnit')})</th>
                  <th>{t('baseAmount')}</th>
                  <th>{t('penalty')}</th>
                  <th>{t('bonus')}</th>
                  <th onClick={() => toggleFSort('netAmount')}><span className="th-sort">{t('netPayable')}<SortIcon active={fSortKey==='netAmount'} dir={fSortDir}/></span></th>
                  <th>{t('paymentMode')}</th>
                  <th onClick={() => toggleFSort('status')}><span className="th-sort">{t('invoiceStatus')}<SortIcon active={fSortKey==='status'} dir={fSortDir}/></span></th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedFarmer.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium text-[var(--text-1)]">{inv.farmer.name}</td>
                    <td className="text-[var(--text-2)] whitespace-nowrap">{new Date(inv.date).toLocaleDateString()}</td>
                    <td dir="ltr">{Number(inv.suppliedMaunds).toFixed(2)} / {Number(inv.contractedMaunds).toFixed(2)}</td>
                    <td dir="ltr">₨{fmt2(Number(inv.baseAmount))}</td>
                    <td className="text-red-600 dark:text-red-400" dir="ltr">
                      {Number(inv.shortfallPenalty) > 0 ? `₨${fmt2(Number(inv.shortfallPenalty))}` : '—'}
                    </td>
                    <td className="text-green-600 dark:text-green-400" dir="ltr">
                      {Number(inv.excessBonus) > 0 ? `₨${fmt2(Number(inv.excessBonus))}` : '—'}
                    </td>
                    <td className="font-semibold text-[var(--text-1)]" dir="ltr">₨{fmt2(Number(inv.netAmount))}</td>
                    <td>
                      {inv.paymentMode
                        ? <span className="badge badge-gray">{inv.paymentMode.replace('_', ' ')}</span>
                        : '—'}
                    </td>
                    <td>
                      {inv.isPaid ? (
                        <div>
                          <span className="badge badge-green">{t('paidInvoices')}</span>
                          {inv.paidAt && <div className="text-xs text-[var(--text-3)] mt-0.5">{new Date(inv.paidAt).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <button type="button" onClick={() => setPayTarget({ id: inv.id, type: 'farmer' })}
                          disabled={isReadonly}
                          className="badge badge-amber cursor-pointer hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed">
                          {t('markAsPaid')}
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <button type="button" onClick={() => downloadFarmerInvoicePDF(inv, orgSettings)}
                        disabled={isReadonly}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                        PDF ↓
                      </button>
                    </td>
                  </tr>
                ))}
                {!sortedFarmer.length && (
                  <tr><td colSpan={10}><div className="empty-state"><span className="empty-state-icon">🧾</span><span className="empty-state-text">{t('noInvoices')}</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={fMeta.page} totalPages={fMeta.totalPages} total={fMeta.total} limit={fMeta.limit} onPage={setFPage} />
        </div>
      )}

      {/* Retailer invoices table */}
      {tab === 'retailers' && (
        <div className="card overflow-hidden">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleRSort('retailer')}><span className="th-sort">{t('retailer')}<SortIcon active={rSortKey==='retailer'} dir={rSortDir}/></span></th>
                  <th onClick={() => toggleRSort('date')}><span className="th-sort">{t('date')}<SortIcon active={rSortKey==='date'} dir={rSortDir}/></span></th>
                  <th>{t('maunds')} ({t('maundsUnit')})</th>
                  <th>{t('baseAmount')}</th>
                  <th>{t('surcharge')}</th>
                  <th onClick={() => toggleRSort('netAmount')}><span className="th-sort">{t('netPayable')}<SortIcon active={rSortKey==='netAmount'} dir={rSortDir}/></span></th>
                  <th>{t('paymentMode')}</th>
                  <th onClick={() => toggleRSort('status')}><span className="th-sort">{t('invoiceStatus')}<SortIcon active={rSortKey==='status'} dir={rSortDir}/></span></th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRetailer.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium text-[var(--text-1)]">{inv.retailer.name}</td>
                    <td className="text-[var(--text-2)] whitespace-nowrap">{new Date(inv.date).toLocaleDateString()}</td>
                    <td dir="ltr">{Number(inv.purchasedMaunds).toFixed(2)} / {Number(inv.committedMaunds).toFixed(2)}</td>
                    <td dir="ltr">₨{fmt2(Number(inv.baseAmount))}</td>
                    <td className="text-orange-600 dark:text-orange-400" dir="ltr">
                      {Number(inv.excessSurcharge) > 0 ? `₨${fmt2(Number(inv.excessSurcharge))}` : '—'}
                    </td>
                    <td className="font-semibold text-[var(--text-1)]" dir="ltr">₨{fmt2(Number(inv.netAmount))}</td>
                    <td>
                      {inv.paymentMode
                        ? <span className="badge badge-gray">{inv.paymentMode.replace('_', ' ')}</span>
                        : '—'}
                    </td>
                    <td>
                      {inv.isPaid ? (
                        <div>
                          <span className="badge badge-green">{t('paidInvoices')}</span>
                          {inv.paidAt && <div className="text-xs text-[var(--text-3)] mt-0.5">{new Date(inv.paidAt).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <button type="button" onClick={() => setPayTarget({ id: inv.id, type: 'retailer' })}
                          className="badge badge-amber cursor-pointer hover:opacity-80">
                          {t('markAsPaid')}
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <button type="button" onClick={() => downloadRetailerInvoicePDF(inv, orgSettings)}
                        disabled={isReadonly}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                        PDF ↓
                      </button>
                    </td>
                  </tr>
                ))}
                {!sortedRetailer.length && (
                  <tr><td colSpan={9}><div className="empty-state"><span className="empty-state-icon">🧾</span><span className="empty-state-text">{t('noInvoices')}</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={rMeta.page} totalPages={rMeta.totalPages} total={rMeta.total} limit={rMeta.limit} onPage={setRPage} />
        </div>
      )}
    </div>
  );
}
