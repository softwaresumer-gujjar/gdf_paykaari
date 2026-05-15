'use client';

import { useEffect, useState } from 'react';
import { transportApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useLang } from '@/lib/language-context';

interface Trip {
  id: string; date: string;
  driver: { name: string }; status: string;
  startTime?: string; endTime?: string;
  stops: { location: string; time: string }[];
  collectionEntries: { id: string; farmer: { name: string }; collectedMaunds: number }[];
}

export default function TransportPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [stopForm, setStopForm] = useState({ location: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const load = async () => {
    const r = await transportApi.trips();
    setTrips(r.data);
  };

  useEffect(() => { load(); }, []);

  const createTrip = async () => {
    if (!user) return;
    setCreating(true);
    try {
      await transportApi.createTrip({ date: new Date().toISOString().split('T')[0], driverId: user.id });
      await load();
    } finally { setCreating(false); }
  };

  const selectTrip = (trip: Trip) => { setSelected(trip); setShowDetail(true); };

  const addStop = async (tripId: string) => {
    if (!stopForm.location) return;
    await transportApi.addStop(tripId, stopForm);
    const r = await transportApi.trip(tripId);
    setSelected(r.data);
    await load();
    setStopForm({ location: '', notes: '' });
  };

  const completeTrip = async (tripId: string) => {
    await transportApi.completeTrip(tripId);
    setSelected(null);
    setShowDetail(false);
    await load();
  };

  const inProgressCount = trips.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = trips.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="w-full space-y-4 animate-fadein">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('transport')}</h1>
          <p className="page-subtitle">
            {inProgressCount} {t('inProgress').toLowerCase()} · {completedCount} {t('completed').toLowerCase()}
          </p>
        </div>
        <button type="button" onClick={createTrip} disabled={creating} className="btn btn-primary">
          {creating ? t('starting') : `+ ${t('startNewTrip')}`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Trip list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="filter-bar justify-between border-b border-gray-100 dark:border-slate-700/60">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('allTrips')}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{trips.length} {t('total').toLowerCase()}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700/40 max-h-[500px] overflow-y-auto">
            {trips.map((trip) => (
              <button key={trip.id} type="button" onClick={() => selectTrip(trip)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30 ${selected?.id === trip.id ? 'bg-blue-50 dark:bg-blue-900/20 ltr:border-l-2 rtl:border-r-2 border-blue-500' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {new Date(trip.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{trip.driver.name}</div>
                  </div>
                  <span className={`flex-shrink-0 badge ${trip.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-green'}`}>
                    {trip.status === 'IN_PROGRESS' ? t('inProgress') : t('completed')}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  {(trip.stops as unknown[]).length} {t('stops').toLowerCase()} · {trip.collectionEntries.length} {t('tripCollections').toLowerCase()}
                </div>
              </button>
            ))}
            {!trips.length && (
              <div className="empty-state py-10">
                <span className="empty-state-icon">🚚</span>
                <span className="empty-state-text">{t('noTrips')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected && showDetail ? (
            <div className="card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-slate-100">{t('tripDetails')}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {new Date(selected.date).toLocaleDateString()} · {selected.driver.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === 'IN_PROGRESS' && (
                    <button type="button" onClick={() => completeTrip(selected.id)}
                      className="btn bg-green-600 text-white hover:bg-green-700 text-xs py-1.5">
                      {t('completeTrip')}
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowDetail(false); setSelected(null); }}
                    className="lg:hidden text-gray-400 hover:text-gray-600 text-xs">{t('close')}</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                <span>{t('startedAt')}: {selected.startTime ? new Date(selected.startTime).toLocaleTimeString() : '—'}</span>
                {selected.endTime && <span>{t('endedAt')}: {new Date(selected.endTime).toLocaleTimeString()}</span>}
                <span className={`badge ${selected.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-green'}`}>
                  {selected.status === 'IN_PROGRESS' ? t('inProgress') : t('completed')}
                </span>
              </div>

              {/* Stops */}
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {t('stops')} ({(selected.stops as unknown[]).length})
                </div>
                {(selected.stops as { location: string; time: string }[]).length > 0 ? (
                  <div className="space-y-1">
                    {(selected.stops as { location: string; time: string }[]).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm py-1.5 px-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-gray-400 text-xs w-5 pt-0.5">{i + 1}.</span>
                        <div>
                          <div className="text-gray-800 dark:text-slate-200 font-medium">{s.location}</div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">{new Date(s.time).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-slate-500 py-2">{t('noStops')}</div>
                )}
                {selected.status === 'IN_PROGRESS' && (
                  <div className="flex gap-2 mt-3">
                    <input placeholder={t('stopLocation')} value={stopForm.location}
                      onChange={(e) => setStopForm((p) => ({ ...p, location: e.target.value }))}
                      className="flex-1 input" />
                    <button type="button" onClick={() => addStop(selected.id)}
                      className="btn btn-primary">{t('add')}</button>
                  </div>
                )}
              </div>

              {/* Collections */}
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {t('tripCollections')} ({selected.collectionEntries.length})
                </div>
                {selected.collectionEntries.length > 0 ? (
                  <div className="space-y-1">
                    {selected.collectionEntries.map((c) => (
                      <div key={c.id} className="flex justify-between items-center text-sm py-1.5 px-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-gray-800 dark:text-slate-200 font-medium">{c.farmer.name}</span>
                        <span className="text-blue-700 dark:text-blue-400 font-semibold" dir="ltr">
                          {Number(c.collectedMaunds)} {t('maundsUnit')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-slate-500">{t('noCollections')}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">🚚</div>
              <div className="text-sm text-gray-400 dark:text-slate-500">{t('selectTripDetail')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
