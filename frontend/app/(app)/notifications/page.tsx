'use client';

import { useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { useLang } from '@/lib/language-context';

type Channel = 'ALL' | 'WHATSAPP' | 'EMAIL' | 'SMS';
type ReadFilter = 'ALL' | 'UNREAD';

interface Notif {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  subject?: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
  farmer?: { name: string } | null;
  retailer?: { name: string } | null;
}

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: 'bg-green-500',
  EMAIL:    'bg-blue-500',
  SMS:      'bg-purple-500',
};

const STATUS_BADGE: Record<string, string> = {
  SENT:    'badge-green',
  PENDING: 'badge-amber',
  FAILED:  'badge-red',
};

export default function NotificationsPage() {
  const { t } = useLang();
  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [loading, setLoading]   = useState(true);
  const [channel, setChannel]   = useState<Channel>('ALL');
  const [readFilter, setReadFilter] = useState<ReadFilter>('ALL');
  const [marking, setMarking]   = useState('');

  const load = () => {
    setLoading(true);
    notificationsApi.list(channel === 'ALL' ? undefined : channel)
      .then((r) => setNotifs(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [channel]);

  const displayed = useMemo(() =>
    readFilter === 'UNREAD' ? notifs.filter((n) => !n.isRead) : notifs,
  [notifs, readFilter]);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    setMarking(id);
    try {
      await notificationsApi.markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } finally { setMarking(''); }
  };

  const markAllRead = async () => {
    setMarking('all');
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally { setMarking(''); }
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notificationsTitle')}</h1>
          <p className="page-subtitle">{t('notificationsDesc')}</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead} disabled={marking === 'all'}
            className="btn btn-secondary text-xs">
            {marking === 'all' ? t('saving') : t('markAllRead')}
            {unreadCount > 0 && (
              <span className="badge badge-blue ltr:ml-1.5 rtl:mr-1.5">{unreadCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['ALL', 'WHATSAPP', 'EMAIL', 'SMS'] as Channel[]).map((ch) => {
          const count = ch === 'ALL' ? notifs.length : notifs.filter((n) => n.channel === ch).length;
          const unread = ch === 'ALL' ? unreadCount : notifs.filter((n) => n.channel === ch && !n.isRead).length;
          return (
            <button key={ch} type="button" onClick={() => setChannel(ch)}
              className={`card p-3 text-left transition-all ${
                channel === ch
                  ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                  : 'card-hover'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                {ch !== 'ALL' && (
                  <span className={`notif-channel-dot ${CHANNEL_COLORS[ch]}`} />
                )}
                <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  {ch === 'ALL' ? t('notifAll') : ch === 'WHATSAPP' ? t('whatsapp') : ch === 'SMS' ? t('sms') : t('email')}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{count}</div>
              {unread > 0 && (
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  {unread} {t('notifUnread')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main card */}
      <div className="card overflow-hidden">
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="tab-group">
            {(['ALL', 'UNREAD'] as ReadFilter[]).map((f) => (
              <button key={f} type="button" onClick={() => setReadFilter(f)}
                className={`tab-btn ${readFilter === f ? 'active' : ''}`}>
                {f === 'ALL' ? t('notifAll') : t('notifUnread')}
                {f === 'UNREAD' && unreadCount > 0 && (
                  <span className="badge badge-blue ltr:ml-1 rtl:mr-1 px-1.5">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ltr:ml-auto rtl:mr-auto">
            {displayed.length} {t('of')} {notifs.length}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm animate-pulse">{t('loading')}</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state py-16">
            <span className="empty-state-icon">🔔</span>
            <span className="empty-state-text">{t('noNotifications')}</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {displayed.map((n) => (
              <div key={n.id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                {/* Channel dot */}
                <span className={`notif-channel-dot mt-1 ${CHANNEL_COLORS[n.channel]}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge ${n.channel === 'WHATSAPP' ? 'badge-green' : n.channel === 'EMAIL' ? 'badge-blue' : 'badge-purple'}`}>
                        {n.channel === 'WHATSAPP' ? t('whatsapp') : n.channel === 'SMS' ? t('sms') : t('email')}
                      </span>
                      <span className={`badge ${STATUS_BADGE[n.status] ?? 'badge-gray'}`}>
                        {n.status}
                      </span>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                      {fmtDate(n.sentAt || n.createdAt)}
                    </span>
                  </div>

                  {n.subject && (
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 mb-0.5">
                      {n.subject}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">{n.message}</div>

                  {(n.farmer || n.retailer) && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      → {n.farmer?.name ?? n.retailer?.name}
                    </div>
                  )}
                </div>

                {/* Mark read button */}
                {!n.isRead && (
                  <button type="button" onClick={() => markRead(n.id)} disabled={marking === n.id}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 self-start mt-0.5">
                    {marking === n.id ? '…' : t('markRead')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
