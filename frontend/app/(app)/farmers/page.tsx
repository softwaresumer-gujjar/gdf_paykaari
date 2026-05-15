'use client';

import { useEffect, useMemo, useState } from 'react';
import { farmersApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import { Pagination } from '@/components/pagination';
import { useSubscription } from '@/lib/subscription-context';

const PAGE_LIMIT = 25;

interface Farmer {
  id: string; name: string; phone?: string; email?: string; address?: string;
  contractedMaunds: number; fixedRatePerMaund: number; isActive: boolean;
  contractStart?: string; contractEnd?: string;
}

const empty = {
  name: '', phone: '', email: '', address: '',
  contractedMaunds: '', fixedRatePerMaund: '',
  contractStart: '', contractEnd: '',
};

type SortKey = 'name' | 'contractedMaunds' | 'fixedRatePerMaund';
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

export default function FarmersPage() {
  const { t } = useLang();
  const { sub } = useSubscription();
  const isReadonly = sub?.isReadonly ?? false;
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const load = () => farmersApi.list().then((r) => setFarmers(r.data));
  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return farmers.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      (f.phone || '').includes(q) ||
      (f.email || '').toLowerCase().includes(q)
    );
  }, [farmers, search]);

  const allSorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'contractedMaunds') cmp = Number(a.contractedMaunds) - Number(b.contractedMaunds);
    else cmp = Number(a.fixedRatePerMaund) - Number(b.fixedRatePerMaund);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(allSorted.length / PAGE_LIMIT);
  const sorted = useMemo(() => allSorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT), [allSorted, page]);

  const openAdd = () => { setEditId(null); setForm(empty); setShowForm(true); };
  const openEdit = (f: Farmer) => {
    setEditId(f.id);
    setForm({
      name: f.name, phone: f.phone || '', email: f.email || '',
      address: f.address || '',
      contractedMaunds: String(f.contractedMaunds),
      fixedRatePerMaund: String(f.fixedRatePerMaund),
      contractStart: f.contractStart ? f.contractStart.split('T')[0] : '',
      contractEnd: f.contractEnd ? f.contractEnd.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        contractedMaunds: Number(form.contractedMaunds),
        fixedRatePerMaund: Number(form.fixedRatePerMaund),
      };
      if (editId) await farmersApi.update(editId, payload);
      else await farmersApi.create(payload);
      await load();
      setShowForm(false);
      setForm(empty);
      setEditId(null);
    } finally { setSaving(false); }
  };

  const deactivate = async (id: string) => {
    if (!confirm(t('deactivateConfirm'))) return;
    await farmersApi.remove(id);
    await load();
  };

  const activeFarmers = farmers.filter((f) => f.isActive).length;
  const totalContracted = farmers.filter((f) => f.isActive).reduce((s, f) => s + Number(f.contractedMaunds), 0);

  const fields = [
    { label: `${t('farmerName')} *`, key: 'name', required: true },
    { label: t('phone'), key: 'phone' },
    { label: t('email'), key: 'email' },
    { label: t('address'), key: 'address' },
    { label: `${t('contractedQty')} *`, key: 'contractedMaunds', type: 'number', required: true },
    { label: `${t('fixedRate')} *`, key: 'fixedRatePerMaund', type: 'number', required: true },
    { label: t('contractPeriod') + ' (' + t('from') + ')', key: 'contractStart', type: 'date' },
    { label: t('contractPeriod') + ' (' + t('to') + ')', key: 'contractEnd', type: 'date' },
  ];

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: t('farmerName') },
    { key: 'contractedMaunds', label: t('dailyQty') },
    { key: 'fixedRatePerMaund', label: t('contractRate') },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('farmers')}</h1>
          <p className="page-subtitle">
            {activeFarmers} {t('activeCount')} · {totalContracted} {t('maundsUnit')}{t('perDay')} {t('contractedLabel')}
          </p>
        </div>
        <button type="button" onClick={openAdd} disabled={isReadonly} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          + {t('addFarmer')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={`${t('search')}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input ltr:pl-9 rtl:pr-9"
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {editId ? t('editFarmer') : t('newFarmer')}
              </h3>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(({ label, key, type = 'text', required }) => (
                  <div key={key}>
                    <label htmlFor={`farmer-${key}`} className="label">{label}</label>
                    <input id={`farmer-${key}`} type={type} required={required}
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
                  {saving ? t('saving') : editId ? t('updateFarmer') : t('saveFarmer')}
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
                <th>{t('contractPeriod')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.name}</td>
                  <td dir="ltr">{fmt2(Number(f.contractedMaunds))} {t('maundsUnit')}</td>
                  <td dir="ltr">₨{fmt2(Number(f.fixedRatePerMaund))}</td>
                  <td>
                    <div>{f.phone || '—'}</div>
                    {f.email && <div className="text-xs text-gray-400 dark:text-slate-500">{f.email}</div>}
                  </td>
                  <td className="text-xs whitespace-nowrap text-gray-500 dark:text-slate-400">
                    {f.contractStart ? new Date(f.contractStart).toLocaleDateString() : '—'}
                    {' – '}
                    {f.contractEnd ? new Date(f.contractEnd).toLocaleDateString() : t('ongoing')}
                  </td>
                  <td>
                    <span className={`badge ${f.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {f.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(f)} disabled={isReadonly}
                      className="text-xs text-blue-600 hover:text-blue-800 ltr:mr-3 rtl:ml-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                      {t('edit')}
                    </button>
                    {f.isActive && (
                      <button type="button" onClick={() => deactivate(f.id)} disabled={isReadonly}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                        {t('deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!sorted.length && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="empty-state-icon">🌾</span>
                      <span className="empty-state-text">{search ? t('noResults') : t('noFarmers')}</span>
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
