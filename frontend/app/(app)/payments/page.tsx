'use client';

import { useEffect, useMemo, useState } from 'react';
import { paymentsApi, farmersApi, retailersApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import { useSubscription } from '@/lib/subscription-context';

type PaymentType = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'ONLINE' | 'GIFT' | 'OTHER';
type Direction = 'INCOMING' | 'OUTGOING';
type SortKey = 'date' | 'amount' | 'direction' | 'paymentType';
type SortDir = 'asc' | 'desc';

interface Payment {
  id: string; date: string; amount: number; paymentType: PaymentType;
  direction: Direction; farmer?: { name: string } | null; retailer?: { name: string } | null;
  reference?: string; notes?: string;
}
interface Summary {
  incoming: { amount: number; count: number };
  outgoing: { amount: number; count: number };
  net: number;
  byType: { type: string; amount: number; count: number }[];
}
interface Farmer { id: string; name: string }
interface Retailer { id: string; name: string }

const PAYMENT_TYPES: PaymentType[] = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'GIFT', 'OTHER'];

const TYPE_COLORS: Record<string, string> = {
  CASH: 'badge-green', CHEQUE: 'badge-blue',
  BANK_TRANSFER: 'badge-amber', ONLINE: 'badge-blue',
  GIFT: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  OTHER: 'badge-gray',
};

const DONUT_COLORS = ['#6366f1','#22c55e','#f59e0b','#06b6d4','#ec4899','#94a3b8'];

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  const active = col === sortKey;
  return (
    <svg className={`sort-icon ${active ? 'active' : ''}`} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4l4 6H4l4-6z"     opacity={active && sortDir === 'asc'  ? 1 : 0.3} />
      <path d="M8 12l-4-6h8l-4 6z" opacity={active && sortDir === 'desc' ? 1 : 0.3} />
    </svg>
  );
}

function TypeDonut({ byType }: { byType: { type: string; amount: number }[] }) {
  const total = byType.reduce((s, b) => s + b.amount, 0) || 1;
  let offset = 0;
  const r = 30; const cx = 40; const cy = 40;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20 flex-shrink-0">
      {byType.map((b, i) => {
        const pct = b.amount / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle key={b.type} cx={cx} cy={cy} r={r} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={12}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
        offset += pct;
        return el;
      })}
      {byType.length === 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12} />}
    </svg>
  );
}

export default function PaymentsPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [fFrom, setFFrom] = useState(monthStart);
  const [fTo, setFTo] = useState(today);
  const [fDir, setFDir] = useState<'' | Direction>('');
  const [fType, setFType] = useState('');
  const [fFarmer, setFFarmer] = useState('');
  const [fRetailer, setFRetailer] = useState('');

  const [form, setForm] = useState({
    date: today, amount: '', paymentType: 'CASH' as PaymentType,
    direction: 'INCOMING' as Direction, farmerId: '', retailerId: '', reference: '', notes: '',
  });

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      CASH: `💵 ${t('cash')}`, CHEQUE: `📃 ${t('cheque')}`,
      BANK_TRANSFER: `🏦 ${t('bankTransfer')}`, ONLINE: `💻 ${t('online')}`,
      GIFT: `🎁 ${t('gift')}`, OTHER: `📦 ${t('other')}`,
    };
    return map[type] ?? type;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        paymentsApi.list({ direction: fDir || undefined, paymentType: fType || undefined, dateFrom: fFrom, dateTo: fTo, farmerId: fFarmer || undefined, retailerId: fRetailer || undefined }),
        paymentsApi.summary(fFrom, fTo),
      ]);
      setPayments(pRes.data);
      setSummary(sRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    farmersApi.list().then((r) => setFarmers(r.data));
    retailersApi.list().then((r) => setRetailers(r.data));
  }, []);

  useEffect(() => { loadAll(); }, [fDir, fType, fFrom, fTo, fFarmer, fRetailer]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedPayments = useMemo(() => [...payments].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortKey === 'amount') cmp = Number(a.amount) - Number(b.amount);
    else if (sortKey === 'direction') cmp = a.direction.localeCompare(b.direction);
    else cmp = a.paymentType.localeCompare(b.paymentType);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [payments, sortKey, sortDir]);

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      await paymentsApi.create({
        ...form, amount: Number(form.amount),
        farmerId: form.farmerId || undefined, retailerId: form.retailerId || undefined,
        reference: form.reference || undefined, notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ date: today, amount: '', paymentType: 'CASH', direction: 'INCOMING', farmerId: '', retailerId: '', reference: '', notes: '' });
      await loadAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await paymentsApi.remove(id);
    setDeleteId(null);
    await loadAll();
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: 'date', label: t('date') },
    { key: 'direction', label: t('paymentDirection') },
    { key: 'paymentType', label: t('paymentType') },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{t('deletePayment')}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t('cannotUndo')}</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteId(null)} className="btn btn-secondary">{t('cancel')}</button>
              <button type="button" onClick={() => handleDelete(deleteId)}
                className="btn bg-red-600 text-white hover:bg-red-700">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('payments')}</h1>
          <p className="page-subtitle">{t('paymentSummary')}</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} disabled={isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          + {t('recordPayment')}
        </button>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">💳 {t('recordNewPayment')}</h3>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="p-date">{t('date')}</label>
                <input id="p-date" type="date" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="p-amount">{t('amount')} (PKR)</label>
                <input id="p-amount" type="number" placeholder="e.g. 50000" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="p-type">{t('paymentType')}</label>
                <select id="p-type" value={form.paymentType}
                  onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value as PaymentType }))} className="input">
                  {PAYMENT_TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-dir">{t('paymentDirection')}</label>
                <select id="p-dir" value={form.direction}
                  onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as Direction }))} className="input">
                  <option value="INCOMING">📥 {t('incoming')}</option>
                  <option value="OUTGOING">📤 {t('outgoing')}</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-farmer">{t('farmer')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <select id="p-farmer" value={form.farmerId}
                  onChange={(e) => setForm((f) => ({ ...f, farmerId: e.target.value, retailerId: '' }))} className="input">
                  <option value="">— {t('allFarmers')} —</option>
                  {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-retailer">{t('retailer')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <select id="p-retailer" value={form.retailerId}
                  onChange={(e) => setForm((f) => ({ ...f, retailerId: e.target.value, farmerId: '' }))} className="input">
                  <option value="">— {t('allRetailers')} —</option>
                  {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-ref">{t('referenceNo')}</label>
                <input id="p-ref" type="text" placeholder="e.g. CHQ-001" value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="p-notes">{t('notes')}</label>
                <input id="p-notes" type="text" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">{t('cancel')}</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? t('saving') : t('savePayment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📥</span>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">{t('totalIncoming')}</span>
            </div>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">₨{fmt2(summary.incoming.amount)}</div>
            <div className="text-xs text-teal-500 mt-0.5">{summary.incoming.count} {t('payments').toLowerCase()}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📤</span>
              <span className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">{t('totalOutgoing')}</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">₨{fmt2(summary.outgoing.amount)}</div>
            <div className="text-xs text-red-400 mt-0.5">{summary.outgoing.count} {t('payments').toLowerCase()}</div>
          </div>
          <div className={`border rounded-xl p-4 ${summary.net >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{summary.net >= 0 ? '📈' : '📉'}</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${summary.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{t('netPosition')}</span>
            </div>
            <div className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>₨{fmt2(Math.abs(summary.net))}</div>
            <div className={`text-xs mt-0.5 ${summary.net >= 0 ? 'text-green-500' : 'text-amber-500'}`}>{summary.net >= 0 ? t('incoming') : t('outgoing')}</div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <TypeDonut byType={summary.byType} />
            <div className="flex-1 min-w-0 space-y-1">
              {summary.byType.slice(0, 3).map((b) => (
                <div key={b.type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400 truncate">{typeLabel(b.type)}</span>
                  <span className="font-semibold text-gray-700 dark:text-slate-200 ltr:ml-1 rtl:mr-1">₨{fmt2(b.amount)}</span>
                </div>
              ))}
              {summary.byType.length === 0 && <div className="text-xs text-gray-400">{t('noData')}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="filter-bar flex-wrap gap-3">
          <div>
            <label className="label" htmlFor="pf-from">{t('from')}</label>
            <input id="pf-from" type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="input !w-auto" />
          </div>
          <div>
            <label className="label" htmlFor="pf-to">{t('to')}</label>
            <input id="pf-to" type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="input !w-auto" />
          </div>
          <div>
            <label className="label" htmlFor="pf-dir">{t('paymentDirection')}</label>
            <select id="pf-dir" value={fDir} onChange={(e) => setFDir(e.target.value as '' | Direction)} className="input !w-auto">
              <option value="">{t('allDirections')}</option>
              <option value="INCOMING">📥 {t('incoming')}</option>
              <option value="OUTGOING">📤 {t('outgoing')}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pf-type">{t('paymentType')}</label>
            <select id="pf-type" value={fType} onChange={(e) => setFType(e.target.value)} className="input !w-auto">
              <option value="">{t('allTypes')}</option>
              {PAYMENT_TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pf-farmer">{t('farmer')}</label>
            <select id="pf-farmer" value={fFarmer} onChange={(e) => setFFarmer(e.target.value)} className="input !w-auto">
              <option value="">{t('allFarmers')}</option>
              {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pf-retailer">{t('retailer')}</label>
            <select id="pf-retailer" value={fRetailer} onChange={(e) => setFRetailer(e.target.value)} className="input !w-auto">
              <option value="">{t('allRetailers')}</option>
              {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Payment table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 dark:text-slate-500 text-sm animate-pulse">{t('loading')}</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map(({ key, label }) => (
                    <th key={key} onClick={() => toggleSort(key)}>
                      <span className="th-sort">{label}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} /></span>
                    </th>
                  ))}
                  <th>{t('party')}</th>
                  <th>{t('amount')} (PKR)</th>
                  <th>{t('referenceNo')}</th>
                  <th>{t('notes')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-gray-500 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${p.direction === 'INCOMING' ? 'badge-green' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {p.direction === 'INCOMING' ? `📥 ${t('incoming')}` : `📤 ${t('outgoing')}`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${TYPE_COLORS[p.paymentType] ?? 'badge-gray'}`}>
                        {typeLabel(p.paymentType)}
                      </span>
                    </td>
                    <td className="font-medium text-gray-900 dark:text-slate-100">
                      {p.farmer?.name ?? p.retailer?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="font-semibold text-gray-900 dark:text-slate-100" dir="ltr">₨{fmt2(Number(p.amount))}</td>
                    <td className="text-gray-400 dark:text-slate-500">{p.reference ?? '—'}</td>
                    <td className="text-gray-400 dark:text-slate-500 max-w-xs truncate">{p.notes ?? '—'}</td>
                    <td>
                      <button type="button" onClick={() => setDeleteId(p.id)} disabled={isReadonly}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
                {!sortedPayments.length && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <span className="empty-state-icon">💳</span>
                      <span className="empty-state-text">{t('noPayments')}</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
