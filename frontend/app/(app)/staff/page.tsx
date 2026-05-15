'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { staffApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';

interface Staff {
  id: string; name: string; phone?: string; email?: string; nic?: string;
  photoUrl?: string; role: string; salary: number; isActive: boolean; joinDate?: string;
}

type SortKey = 'name' | 'salary' | 'role';
type SortDir = 'asc' | 'desc';

const empty = { name: '', phone: '', email: '', nic: '', role: 'DRIVER', salary: '', joinDate: '', photoUrl: '' };

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

export default function StaffPage() {
  const { t } = useLang();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payroll, setPayroll] = useState<{ _sum: { salary: number | null }; _count: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const photoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [s, p] = await Promise.all([staffApi.list(), staffApi.payroll()]);
    setStaff(s.data);
    setPayroll(p.data);
  };

  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => [...staff].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'salary') cmp = Number(a.salary) - Number(b.salary);
    else cmp = a.role.localeCompare(b.role);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [staff, sortKey, sortDir]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await staffApi.create({
        name: form.name, phone: form.phone || undefined, email: form.email || undefined,
        nic: form.nic || undefined, photoUrl: form.photoUrl || undefined,
        role: form.role, salary: Number(form.salary), joinDate: form.joinDate || undefined,
      });
      await load();
      setShowForm(false);
      setForm(empty);
      if (photoRef.current) photoRef.current.value = '';
    } finally { setSaving(false); }
  };

  const deactivate = async (id: string) => {
    if (!confirm(t('deactivateConfirm'))) return;
    await staffApi.remove(id);
    await load();
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: t('staffName') },
    { key: 'role', label: t('staffRole') },
    { key: 'salary', label: t('salary') },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff')}</h1>
          <p className="page-subtitle">{t('payroll')}</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary">
          + {t('addStaff')}
        </button>
      </div>

      {/* Payroll summary */}
      {payroll && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-5">
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium tracking-wide mb-1">{t('totalActiveStaff')}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{payroll._count}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium tracking-wide mb-1">{t('monthlyPayrollPKR')}</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400" dir="ltr">
              ₨{fmt2(Number(payroll._sum.salary ?? 0))}
            </div>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{t('newStaff')}</h3>
              <button type="button" onClick={() => { setShowForm(false); setForm(empty); if (photoRef.current) photoRef.current.value = ''; }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Photo upload */}
                <div className="sm:col-span-2 flex items-center gap-4">
                  {form.photoUrl
                    ? <img src={form.photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-slate-700" />
                    : <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-2xl text-gray-400">👤</div>
                  }
                  <div>
                    <label htmlFor="staff-photo" className="label">{t('profilePhoto')}</label>
                    <input id="staff-photo" ref={photoRef} type="file" accept="image/*" onChange={handlePhoto}
                      className="text-xs text-gray-600 dark:text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="staff-name" className="label">{t('staffName')} *</label>
                  <input id="staff-name" required value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" />
                </div>
                <div>
                  <label htmlFor="staff-phone" className="label">{t('phoneLabel')}</label>
                  <input id="staff-phone" value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="input" />
                </div>
                <div>
                  <label htmlFor="staff-email" className="label">{t('email')}</label>
                  <input id="staff-email" type="email" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="input" />
                </div>
                <div>
                  <label htmlFor="staff-nic" className="label">{t('nic')}</label>
                  <input id="staff-nic" maxLength={15} value={form.nic}
                    onChange={(e) => setForm((p) => ({ ...p, nic: e.target.value }))}
                    placeholder="e.g. 3520112345678" className="input" />
                </div>
                <div>
                  <label htmlFor="staff-role" className="label">{t('staffRole')}</label>
                  <select id="staff-role" value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="input">
                    <option value="DRIVER">{t('driver')}</option>
                    <option value="HELPER">{t('helper')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="staff-salary" className="label">{t('salary')} (PKR) *</label>
                  <input id="staff-salary" required type="number" value={form.salary}
                    onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} className="input" />
                </div>
                <div>
                  <label htmlFor="staff-joindate" className="label">{t('joiningDate')}</label>
                  <input id="staff-joindate" type="date" value={form.joinDate}
                    onChange={(e) => setForm((p) => ({ ...p, joinDate: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowForm(false); setForm(empty); if (photoRef.current) photoRef.current.value = ''; }}
                  className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t('saving') : t('saveStaff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff table */}
      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th><span className="sr-only">{t('profilePhoto')}</span></th>
                {headers.map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}>
                    <span className="th-sort">{label}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th>{t('nic')}</th>
                <th>{t('phoneEmail')}</th>
                <th>{t('joiningDate')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.photoUrl
                      ? <img src={s.photoUrl} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700" />
                      : <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-base text-gray-400">👤</div>
                    }
                  </td>
                  <td className="font-medium text-gray-900 dark:text-slate-100">{s.name}</td>
                  <td>
                    <span className={`badge ${s.role === 'DRIVER' ? 'badge-blue' : 'badge-amber'}`}>
                      {s.role === 'DRIVER' ? t('driver') : t('helper')}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-900 dark:text-slate-100" dir="ltr">₨{fmt2(Number(s.salary))}</td>
                  <td className="text-gray-500 dark:text-slate-400 font-mono text-xs">{s.nic || '—'}</td>
                  <td>
                    <div className="text-gray-700 dark:text-slate-300">{s.phone || '—'}</div>
                    {s.email && <div className="text-xs text-gray-400 dark:text-slate-500">{s.email}</div>}
                  </td>
                  <td className="text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {s.joinDate ? new Date(s.joinDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {s.isActive ? t('active') : t('inactive')}
                    </span>
                    {s.isActive && (
                      <button type="button" onClick={() => deactivate(s.id)}
                        className="ltr:ml-2 rtl:mr-2 text-xs text-red-500 hover:text-red-700 font-medium">
                        {t('deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!sorted.length && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <span className="empty-state-icon">👤</span>
                    <span className="empty-state-text">{t('noStaff')}</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
