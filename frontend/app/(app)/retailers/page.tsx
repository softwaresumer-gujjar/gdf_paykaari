'use client';

import { useEffect, useMemo, useState } from 'react';
import { retailersApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import { Pagination } from '@/components/pagination';
import { useSubscription } from '@/lib/subscription-context';

const PAGE_LIMIT = 25;

interface Retailer {
  id: string; name: string; phone?: string; email?: string;
  address?: string; committedMaunds: number; fixedRatePerMaund: number; isActive: boolean;
}

const empty = { name: '', phone: '', email: '', address: '', committedMaunds: '', fixedRatePerMaund: '' };

type SortKey = 'name' | 'committedMaunds' | 'fixedRatePerMaund';
type SortDir = 'asc' | 'desc';

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

export default function RetailersPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const load = () => retailersApi.list().then((r) => setRetailers(r.data));
  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return retailers.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.email || '').toLowerCase().includes(q)
    );
  }, [retailers, search]);

  const allSorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'committedMaunds') cmp = Number(a.committedMaunds) - Number(b.committedMaunds);
    else cmp = Number(a.fixedRatePerMaund) - Number(b.fixedRatePerMaund);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(allSorted.length / PAGE_LIMIT);
  const sorted = useMemo(() => allSorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT), [allSorted, page]);

  const openAdd = () => { setEditId(null); setForm(empty); setShowForm(true); };
  const openEdit = (r: Retailer) => {
    setEditId(r.id);
    setForm({
      name: r.name, phone: r.phone || '', email: r.email || '',
      address: r.address || '',
      committedMaunds: String(r.committedMaunds),
      fixedRatePerMaund: String(r.fixedRatePerMaund),
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        committedMaunds: Number(form.committedMaunds),
        fixedRatePerMaund: Number(form.fixedRatePerMaund),
      };
      if (editId) await retailersApi.update(editId, payload);
      else await retailersApi.create(payload);
      await load();
      setShowForm(false);
      setForm(empty);
      setEditId(null);
    } finally { setSaving(false); }
  };

  const deactivate = async (id: string) => {
    if (!confirm(t('deactivateConfirm'))) return;
    await retailersApi.remove(id);
    await load();
  };

  const activeRetailers = retailers.filter((r) => r.isActive).length;
  const totalCommitted = retailers.filter((r) => r.isActive).reduce((s, r) => s + Number(r.committedMaunds), 0);

  const fields = [
    { label: `${t('retailerName')} *`, key: 'name', required: true },
    { label: t('phoneLabel'), key: 'phone' },
    { label: t('email'), key: 'email' },
    { label: t('address'), key: 'address' },
    { label: `${t('committedQty')} *`, key: 'committedMaunds', type: 'number', required: true },
    { label: `${t('fixedRate')} *`, key: 'fixedRatePerMaund', type: 'number', required: true },
  ];

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: t('retailerName') },
    { key: 'committedMaunds', label: t('dailyQty') },
    { key: 'fixedRatePerMaund', label: t('contractRate') },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('retailers')}</h1>
          <p className="page-subtitle">
            {activeRetailers} {t('activeCount')} · {totalCommitted} {t('maundsUnit')}{t('perDay')} {t('committedLabel')}
          </p>
        </div>
        <button type="button" onClick={openAdd} disabled={isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          + {t('addRetailer')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder={`${t('search')}…`} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input ltr:pl-9 rtl:pr-9" />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {editId ? t('editRetailer') : t('newRetailer')}
              </h3>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(({ label, key, type = 'text', required }) => (
                  <div key={key}>
                    <label htmlFor={`ret-${key}`} className="label">{label}</label>
                    <input id={`ret-${key}`} type={type} required={required}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="input" />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                  className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t('saving') : editId ? t('updateRetailer') : t('saveRetailer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}>
                    <span className="th-sort">{label}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th>{t('phoneEmail')}</th>
                <th>{t('area')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-900 dark:text-slate-100">{r.name}</td>
                  <td dir="ltr">{fmt2(Number(r.committedMaunds))} {t('maundsUnit')}</td>
                  <td dir="ltr">₨{fmt2(Number(r.fixedRatePerMaund))}</td>
                  <td>
                    <div className="text-gray-700 dark:text-slate-300">{r.phone || '—'}</div>
                    {r.email && <div className="text-xs text-gray-400 dark:text-slate-500">{r.email}</div>}
                  </td>
                  <td className="text-gray-500 dark:text-slate-400">{r.address || '—'}</td>
                  <td>
                    <span className={`badge ${r.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {r.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(r)} disabled={isReadonly}
                      className="text-xs text-blue-600 hover:text-blue-800 ltr:mr-3 rtl:ml-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                      {t('edit')}
                    </button>
                    {r.isActive && (
                      <button type="button" onClick={() => deactivate(r.id)} disabled={isReadonly}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                        {t('deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!sorted.length && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-state-icon">🏪</span>
                    <span className="empty-state-text">{search ? t('noResults') : t('noRetailers')}</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={allSorted.length} limit={PAGE_LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}
