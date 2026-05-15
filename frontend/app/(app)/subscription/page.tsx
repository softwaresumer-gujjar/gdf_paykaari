'use client';

import { useEffect, useState } from 'react';
import { subscriptionApi } from '@/lib/api';

interface PlanFeatures {
  collection: boolean;
  delivery: boolean;
  billing: boolean;
  reports: boolean;
  accounts: boolean;
  transport: boolean;
  staff: boolean;
  multiUser: boolean;
  maxFarmers: number;
  maxRetailers: number;
  durationDays: number;
  price: number;
  label: string;
}

interface PlanInfo extends PlanFeatures { key: string }

interface SubscriptionData {
  id: string;
  plan: string;
  planLabel: string;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  amountPaid: number;
  features: PlanFeatures;
  notes?: string;
  allPlans: PlanInfo[];
}

function FeatureRow({ label, enabled, detail }: { label: string; enabled: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {enabled ? '✓' : '✗'}
        </span>
        <span className={`text-sm ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
      </div>
      {detail && <span className="text-xs text-gray-400">{detail}</span>}
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700 border-gray-200',
  BASIC: 'bg-blue-100 text-blue-700 border-blue-200',
  STANDARD: 'bg-purple-100 text-purple-700 border-purple-200',
  PREMIUM: 'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionApi.current()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading subscription…</div>
      </div>
    );
  }

  if (!data) {
    return <div className="w-full text-red-500 text-sm">Failed to load subscription info.</div>;
  }

  const daysTotal = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const daysUsed = daysTotal - data.daysRemaining;
  const progressPct = daysTotal > 0 ? Math.min(100, Math.round((daysUsed / daysTotal) * 100)) : 100;
  const isExpiring = data.daysRemaining <= 3 && data.status === 'ACTIVE';

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your plan and feature access</p>
      </div>

      {/* Current plan card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 ${data.plan === 'PREMIUM' ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${PLAN_COLORS[data.plan] || 'bg-gray-100 text-gray-700'}`}>
              {data.plan === 'TRIAL' ? '🆓 ' : data.plan === 'PREMIUM' ? '👑 ' : data.plan === 'STANDARD' ? '⭐ ' : ''}
              {data.planLabel}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[data.status] || 'bg-gray-100 text-gray-600'}`}>
              {data.status}
            </span>
          </div>
          {data.amountPaid > 0 && (
            <div className="text-sm text-gray-600">
              Paid: <span className="font-semibold text-gray-900">PKR {data.amountPaid.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Dates */}
          <div>
            <div className="text-xs text-gray-400 uppercase font-medium mb-3">Validity Period</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Start</span>
                <span className="font-medium text-gray-800">{new Date(data.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">End</span>
                <span className="font-medium text-gray-800">{new Date(data.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Days remaining */}
          <div>
            <div className="text-xs text-gray-400 uppercase font-medium mb-3">Time Remaining</div>
            <div className={`text-3xl font-bold mb-1 ${data.status === 'EXPIRED' ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-gray-900'}`}>
              {data.status === 'EXPIRED' ? 'Expired' : `${data.daysRemaining}d`}
            </div>
            <div className="text-xs text-gray-400">{daysUsed} of {daysTotal} days used</div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${data.status === 'EXPIRED' ? 'bg-red-400' : isExpiring ? 'bg-amber-400' : 'bg-blue-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <div className="text-xs text-gray-400 uppercase font-medium mb-3">Limits</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max Farmers</span>
                <span className="font-medium text-gray-800">
                  {data.features.maxFarmers === -1 ? 'Unlimited' : data.features.maxFarmers}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max Retailers</span>
                <span className="font-medium text-gray-800">
                  {data.features.maxRetailers === -1 ? 'Unlimited' : data.features.maxRetailers}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Multi-User</span>
                <span className={`font-medium ${data.features.multiUser ? 'text-green-600' : 'text-gray-400'}`}>
                  {data.features.multiUser ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isExpiring && (
          <div className="px-6 pb-5">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              Your subscription expires in {data.daysRemaining} day{data.daysRemaining !== 1 ? 's' : ''}. Contact your provider to renew.
            </div>
          </div>
        )}

        {data.status === 'EXPIRED' && (
          <div className="px-6 pb-5">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              Your subscription has expired. Please contact your provider to continue using the system.
            </div>
          </div>
        )}
      </div>

      {/* Features enabled */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Features in Your Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            <FeatureRow label="🥛 Milk Collection" enabled={data.features.collection} />
            <FeatureRow label="🚚 Milk Delivery" enabled={data.features.delivery} />
            <FeatureRow label="🧾 Billing & Invoices" enabled={data.features.billing} />
            <FeatureRow label="💳 Payments (Cash, Cheque, Gift…)" enabled={data.features.billing} />
            <FeatureRow label="📊 Reports (Collection, Quality, Finance)" enabled={data.features.reports} />
          </div>
          <div>
            <FeatureRow label="💰 Accounts (P&L + Balance Sheet)" enabled={data.features.accounts} />
            <FeatureRow label="⚖️ Receivables & Payables" enabled={data.features.accounts} />
            <FeatureRow label="🛣️ Transport & Trips" enabled={data.features.transport} />
            <FeatureRow label="👥 Staff Management" enabled={data.features.staff} />
            <FeatureRow label="👤 Multi-User Access" enabled={data.features.multiUser} />
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.allPlans.map((plan) => {
            const isCurrent = plan.key === data.plan;
            return (
              <div key={plan.key}
                className={`rounded-xl border p-5 space-y-3 transition-all ${isCurrent ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan.key] || 'bg-gray-100 text-gray-700'}`}>
                    {plan.key}
                  </span>
                  {isCurrent && <span className="text-xs text-blue-600 font-semibold">Current</span>}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{plan.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>
                    {plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}`}
                    {plan.price > 0 && <span className="text-xs font-normal text-gray-400">/mo</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{plan.durationDays} days</div>
                </div>
                <div className="text-xs space-y-1 text-gray-600 pt-1 border-t border-gray-100">
                  <div>{plan.maxFarmers === -1 ? 'Unlimited' : plan.maxFarmers} farmers</div>
                  <div>{plan.maxRetailers === -1 ? 'Unlimited' : plan.maxRetailers} retailers</div>
                  {plan.billing && <div className="text-green-600">✓ Billing + Payments</div>}
                  {plan.reports && <div className="text-green-600">✓ Reports & Quality</div>}
                  {plan.accounts && <div className="text-green-600">✓ Accounts & Receivables</div>}
                  {plan.transport && <div className="text-green-600">✓ Transport</div>}
                  {plan.staff && <div className="text-green-600">✓ Staff</div>}
                  {plan.multiUser && <div className="text-green-600">✓ Multi-user</div>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">To upgrade your subscription, contact your MilkFlow provider.</p>
      </div>
    </div>
  );
}
