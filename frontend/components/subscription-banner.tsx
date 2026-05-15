'use client';

import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/subscription-context';

export function SubscriptionBanner() {
  const { sub } = useSubscription();
  const router = useRouter();

  if (!sub) return null;

  if (sub.isExpired) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-600 text-white text-xs font-medium">
        <span>
          Subscription expired — the system is in <strong>read-only mode</strong>. Contact your provider to renew.
        </span>
        <button type="button" onClick={() => router.push('/settings?tab=sub')}
          className="flex-shrink-0 px-3 py-1 bg-white text-red-600 rounded-full text-xs font-semibold hover:bg-red-50 transition-colors">
          Renew Now
        </button>
      </div>
    );
  }

  if (sub.isExpiring && sub.daysRemaining !== null) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500 text-white text-xs font-medium">
        <span>
          Subscription expires in <strong>{sub.daysRemaining} day{sub.daysRemaining !== 1 ? 's' : ''}</strong> — renew soon to avoid interruption.
        </span>
        <button type="button" onClick={() => router.push('/settings?tab=sub')}
          className="flex-shrink-0 px-3 py-1 bg-white text-amber-600 rounded-full text-xs font-semibold hover:bg-amber-50 transition-colors">
          Upgrade
        </button>
      </div>
    );
  }

  if ((sub.isTrial || sub.isFree) && sub.daysRemaining !== null) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-600 text-white text-xs font-medium">
        <span>
          {sub.isTrial ? 'Trial' : 'Free'} plan — <strong>{sub.daysRemaining} day{sub.daysRemaining !== 1 ? 's' : ''}</strong> remaining.
          Upgrade to unlock all features.
        </span>
        <button type="button" onClick={() => router.push('/settings?tab=sub')}
          className="flex-shrink-0 px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-50 transition-colors">
          Upgrade
        </button>
      </div>
    );
  }

  return null;
}
