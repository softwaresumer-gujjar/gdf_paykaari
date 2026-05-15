'use client';

import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import type { TranslationKey } from '@/lib/lang';

const ROLES = ['ADMIN', 'MANAGER', 'DRIVER', 'VIEWER'] as const;
type Role = typeof ROLES[number];
type Tab = 'users' | 'permissions';
type SortKey = 'name' | 'email' | 'role' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface AppUser {
  id: string; name: string; email: string; role: Role;
  isBlocked: boolean; inviteToken?: string | null;
  allowedPages: string[]; department?: string; position?: string;
  createdAt: string;
}

const ROLE_COLORS: Record<Role, string> = {
  ADMIN:   'badge badge-purple',
  MANAGER: 'badge badge-blue',
  DRIVER:  'badge badge-amber',
  VIEWER:  'badge badge-gray',
};

const ALL_PAGES = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'farmers',      label: 'Farmers' },
  { key: 'retailers',    label: 'Retailers' },
  { key: 'collection',   label: 'Collection' },
  { key: 'delivery',     label: 'Delivery' },
  { key: 'market-rates', label: 'Market Rates' },
  { key: 'billing',      label: 'Billing' },
  { key: 'payments',     label: 'Payments' },
  { key: 'reports',      label: 'Reports' },
  { key: 'accounts',     label: 'Accounts' },
  { key: 'transport',    label: 'Transport' },
  { key: 'staff',        label: 'Staff' },
  { key: 'scheduler',    label: 'Scheduler' },
  { key: 'notifications',label: 'Notifications' },
];

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  const active = col === sortKey;
  return (
    <svg className={`sort-icon ${active ? 'active' : ''}`} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4l4 6H4l4-6z"     opacity={active && sortDir === 'asc'  ? 1 : 0.3} />
      <path d="M8 12l-4-6h8l-4 6z" opacity={active && sortDir === 'desc' ? 1 : 0.3} />
    </svg>
  );
}

function StatusBadge({ user, t }: { user: AppUser; t: (k: TranslationKey) => string }) {
  if (user.inviteToken)
    return <span className="badge badge-amber">{t('pending')}</span>;
  if (user.isBlocked)
    return <span className="badge badge-red">{t('blocked')}</span>;
  return <span className="badge badge-green">{t('active')}</span>;
}

/* ─── Permissions panel ─────────────────────────────────────────────────── */
function PermissionsPanel({ user, t, onSaved }: {
  user: AppUser;
  t: (k: TranslationKey) => string;
  onSaved: () => void;
}) {
  const isFullAccess = user.role === 'ADMIN' || user.role === 'MANAGER';
  const [pages, setPages] = useState<string[]>(user.allowedPages ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) =>
    setPages((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updatePermissions(user.id, pages);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 dark:text-slate-400">{t('permissionsDesc')}</div>
      {isFullAccess ? (
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
          ℹ️ {t('allPagesAccess')}
        </div>
      ) : (
        <>
          <div className="perm-grid">
            {ALL_PAGES.map((p) => {
              const checked = pages.includes(p.key);
              return (
                <button key={p.key} type="button" onClick={() => toggle(p.key)}
                  className={`perm-item ${checked ? 'checked' : ''}`}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    {checked
                      ? <path d="M2 8a6 6 0 1012 0A6 6 0 002 8zm9-2.5L7.5 11 5 8.5l1-1 1.5 1.5 3.5-3.5 1 1z" />
                      : <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />}
                  </svg>
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setPages(ALL_PAGES.map((p) => p.key))}
              className="text-xs text-blue-600 hover:underline">{t('all')}</button>
            <button type="button" onClick={() => setPages([])}
              className="text-xs text-gray-500 hover:underline">{t('clearFilters')}</button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="btn btn-primary ltr:ml-auto rtl:mr-auto text-xs px-3 py-1.5">
              {saved ? '✓ ' + t('permissionsSaved') : saving ? t('savingPermissions') : t('savePermissions')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { t } = useLang();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  /* Filters */
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'blocked' | 'pending'>('ALL');

  /* Sort */
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  /* Invite modal */
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'VIEWER' as Role, department: '', position: '' });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const [copied, setCopied] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const load = () => {
    setLoading(true);
    usersApi.list().then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterRole !== 'ALL') list = list.filter((u) => u.role === filterRole);
    if (filterStatus === 'active')  list = list.filter((u) => !u.isBlocked && !u.inviteToken);
    if (filterStatus === 'blocked') list = list.filter((u) => u.isBlocked && !u.inviteToken);
    if (filterStatus === 'pending') list = list.filter((u) => !!u.inviteToken);
    return list;
  }, [users, search, filterRole, filterStatus]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name')      cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'email')  cmp = a.email.localeCompare(b.email);
    else if (sortKey === 'role')   cmp = a.role.localeCompare(b.role);
    else if (sortKey === 'status') {
      const s = (u: AppUser) => u.inviteToken ? 2 : u.isBlocked ? 1 : 0;
      cmp = s(a) - s(b);
    }
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const r = await usersApi.invite(inviteForm);
      const d = r.data as { inviteUrl?: string; inviteLink?: string };
      const rawLink = d.inviteUrl || d.inviteLink || '';
      setInviteLink(`${window.location.origin}${rawLink}`);
      setInviteForm({ name: '', email: '', role: 'VIEWER', department: '', position: '' });
      load();
    } finally { setInviting(false); }
  };

  const copyToClipboard = async (link: string, key: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleResetPassword = async (id: string) => {
    setActionLoading(id + '-reset');
    try {
      const r = await usersApi.resetPassword(id);
      const d = r.data as { inviteUrl?: string };
      await copyToClipboard(`${window.location.origin}${d.inviteUrl || ''}`, id + '-reset');
    } finally { setActionLoading(''); }
  };

  const handleToggleBlock = async (user: AppUser) => {
    setActionLoading(user.id + '-block');
    try {
      if (user.isBlocked && !user.inviteToken) await usersApi.unblock(user.id);
      else if (!user.isBlocked) await usersApi.block(user.id);
      load();
    } finally { setActionLoading(''); }
  };

  const handleRoleChange = async (id: string, role: Role) => {
    setActionLoading(id + '-role');
    try { await usersApi.updateRole(id, role); load(); }
    finally { setActionLoading(''); }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(t('removeUser') + '?')) return;
    setActionLoading(id + '-del');
    try { await usersApi.remove(id); load(); }
    finally { setActionLoading(''); }
  };

  const headers: { key: SortKey; label: TranslationKey }[] = [
    { key: 'name',      label: 'name' },
    { key: 'email',     label: 'email' },
    { key: 'role',      label: 'role' },
    { key: 'status',    label: 'status' },
    { key: 'createdAt', label: 'joinedDate' },
  ];

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('usersPageTitle')}</h1>
          <p className="page-subtitle">{t('usersPageDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="tab-group">
            <button type="button" onClick={() => setActiveTab('users')}
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>
              👥 {t('usersPageTitle')}
            </button>
            <button type="button" onClick={() => setActiveTab('permissions')}
              className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}>
              🔑 {t('permissions')}
            </button>
          </div>
          <button type="button" onClick={() => { setShowInvite(true); setInviteLink(''); }}
            className="btn btn-primary">
            + {t('inviteUser')}
          </button>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="modal-backdrop">
          <div className="modal-card w-full max-w-md">
            <div className="modal-header">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('inviteUser')}</h2>
              <button type="button" onClick={() => { setShowInvite(false); setInviteLink(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">✕</button>
            </div>
            {inviteLink ? (
              <div className="modal-body space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 text-sm text-green-700 dark:text-green-300">
                  ✓ {t('inviteUser')} — {t('copyLink')}
                </div>
                <div>
                  <div className="label mb-1">{t('copyLink')}</div>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} dir="ltr" title="Invite link"
                      className="input flex-1 text-xs font-mono truncate" />
                    <button type="button" onClick={() => copyToClipboard(inviteLink, 'modal')}
                      className="btn btn-primary text-xs px-3">
                      {copied === 'modal' ? '✓' : t('copyLink')}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => { setShowInvite(false); setInviteLink(''); }}
                  className="btn btn-secondary w-full">{t('close')}</button>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="modal-body space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label" htmlFor="inv-name">{t('name')}</label>
                      <input id="inv-name" required value={inviteForm.name} className="input"
                        onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label" htmlFor="inv-email">{t('email')}</label>
                      <input id="inv-email" type="email" required dir="ltr" value={inviteForm.email} className="input"
                        onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label" htmlFor="inv-role">{t('role')}</label>
                      <select id="inv-role" value={inviteForm.role} className="input"
                        onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as Role }))}>
                        {ROLES.filter((r) => r !== 'ADMIN').map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="inv-dept">{t('department')}</label>
                      <input id="inv-dept" value={inviteForm.department} className="input"
                        onChange={(e) => setInviteForm((p) => ({ ...p, department: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label" htmlFor="inv-pos">{t('position')}</label>
                      <input id="inv-pos" value={inviteForm.position} className="input"
                        onChange={(e) => setInviteForm((p) => ({ ...p, position: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowInvite(false)} className="btn btn-secondary">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={inviting} className="btn btn-primary">
                    {inviting ? '…' : t('inviteUser')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Users tab ── */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          {/* Filter bar */}
          <div className="filter-bar">
            <input
              type="search" value={search} placeholder={t('search')}
              onChange={(e) => setSearch(e.target.value)}
              className="input max-w-xs py-1.5 text-xs"
            />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as Role | 'ALL')}
              title={t('filterByRole')} aria-label={t('filterByRole')}
              className="input w-auto py-1.5 text-xs">
              <option value="ALL">{t('all')}</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              title={t('filterByStatus')} aria-label={t('filterByStatus')}
              className="input w-auto py-1.5 text-xs">
              <option value="ALL">{t('all')}</option>
              <option value="active">{t('active')}</option>
              <option value="blocked">{t('blocked')}</option>
              <option value="pending">{t('pending')}</option>
            </select>
            {(search || filterRole !== 'ALL' || filterStatus !== 'ALL') && (
              <button type="button" onClick={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors">{t('clearFilters')}</button>
            )}
            <span className="text-xs text-gray-400 ltr:ml-auto rtl:mr-auto">
              {sorted.length} {t('of')} {users.length}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm animate-pulse">{t('loading')}</div>
          ) : (
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
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => (
                    <tr key={u.id}>
                      {/* Name */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-1 flex-wrap">
                              {u.name}
                              {u.id === me?.id && (
                                <span className="text-[10px] text-blue-500 font-normal">({t('you')})</span>
                              )}
                            </div>
                            {u.position && (
                              <div className="text-[10px] text-gray-400 truncate">{u.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td>
                        <span className="text-xs text-gray-500 dark:text-slate-400" dir="ltr">{u.email}</span>
                      </td>
                      {/* Role */}
                      <td>
                        {u.id === me?.id || u.role === 'ADMIN' ? (
                          <span className={ROLE_COLORS[u.role]}>{u.role}</span>
                        ) : (
                          <select value={u.role} disabled={!!actionLoading}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            aria-label={`Role for ${u.name}`}
                            className={`text-xs border border-gray-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium`}>
                            {ROLES.filter((r) => r !== 'ADMIN').map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      {/* Status */}
                      <td><StatusBadge user={u} t={t} /></td>
                      {/* Joined */}
                      <td className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      {/* Actions */}
                      <td>
                        {u.id !== me?.id && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {u.inviteToken && (
                              <button type="button"
                                onClick={async () => {
                                  const r = await usersApi.resetPassword(u.id);
                                  const d = r.data as { inviteUrl?: string };
                                  copyToClipboard(`${window.location.origin}${d.inviteUrl || ''}`, u.id + '-copy');
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                {copied === u.id + '-copy' ? '✓' : t('copyLink')}
                              </button>
                            )}
                            {!u.inviteToken && (
                              <button type="button" disabled={actionLoading === u.id + '-reset'}
                                onClick={() => handleResetPassword(u.id)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
                                {copied === u.id + '-reset' ? '✓' : t('resetPassword')}
                              </button>
                            )}
                            {!u.inviteToken && (
                              <button type="button" disabled={!!actionLoading}
                                onClick={() => handleToggleBlock(u)}
                                className={`text-xs hover:underline disabled:opacity-50 ${u.isBlocked ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {actionLoading === u.id + '-block' ? '…' : u.isBlocked ? t('unblock') : t('block')}
                              </button>
                            )}
                            <button type="button"
                              onClick={() => { setSelectedUser(u); setActiveTab('permissions'); }}
                              className="text-xs text-gray-500 dark:text-slate-400 hover:underline">
                              🔑
                            </button>
                            <button type="button" disabled={actionLoading === u.id + '-del'}
                              onClick={() => handleRemove(u.id)}
                              className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50">
                              {actionLoading === u.id + '-del' ? '…' : t('removeUser')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!sorted.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <span className="empty-state-icon">👥</span>
                          <span className="empty-state-text">{t('noResults')}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Permissions tab ── */}
      {activeTab === 'permissions' && (
        <div className="card overflow-hidden">
          <div className="filter-bar">
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              🔑 {t('permissions')}
            </span>
            <span className="text-xs text-gray-400 ltr:ml-2 rtl:mr-2">{t('permissionsDesc')}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-slate-700">
            {/* User list */}
            <div className="lg:col-span-1 divide-y divide-gray-100 dark:divide-slate-700">
              {users.filter((u) => u.id !== me?.id && u.role !== 'ADMIN').map((u) => (
                <button key={u.id} type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                    selectedUser?.id === u.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">{u.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{u.role}</div>
                  </div>
                  <span className={`badge text-[10px] ${ROLE_COLORS[u.role]}`} />
                </button>
              ))}
              {users.filter((u) => u.id !== me?.id && u.role !== 'ADMIN').length === 0 && (
                <div className="empty-state py-8">
                  <span className="empty-state-text">{t('noData')}</span>
                </div>
              )}
            </div>

            {/* Permissions panel */}
            <div className="lg:col-span-2">
              {selectedUser ? (
                <div>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {selectedUser.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{selectedUser.name}</div>
                      <div className="text-xs text-gray-400">{selectedUser.email}</div>
                    </div>
                  </div>
                  <PermissionsPanel key={selectedUser.id} user={selectedUser} t={t} onSaved={load} />
                </div>
              ) : (
                <div className="empty-state h-full py-16">
                  <span className="empty-state-icon">🔑</span>
                  <span className="empty-state-text">{t('permissions')}</span>
                  <span className="text-xs text-gray-400">{t('permissionsDesc')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
