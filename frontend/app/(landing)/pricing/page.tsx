import Link from 'next/link';

const PLANS = [
  {
    key: 'FREE',
    name: 'Free',
    price: 0,
    period: 'forever',
    badge: null,
    description: 'For very small operations just getting started.',
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    cta: 'Get Started Free',
    ctaClass: 'bg-gray-800 text-white hover:bg-gray-900',
    features: [
      { label: 'Farmers', value: 'Up to 2' },
      { label: 'Retailers', value: 'Up to 2' },
      { label: 'Milk Collection', value: true },
      { label: 'Milk Delivery', value: true },
      { label: 'Billing & Invoices', value: false },
      { label: 'Reports', value: false },
      { label: 'Accounts (P&L)', value: false },
      { label: 'Transport', value: false },
      { label: 'Staff Management', value: false },
      { label: 'Multi-User', value: false },
      { label: 'WhatsApp Notifications', value: false },
      { label: 'PDF / Excel Export', value: false },
    ],
  },
  {
    key: 'TRIAL',
    name: 'Trial',
    price: 0,
    period: '14 days',
    badge: 'Start Here',
    description: 'Full-featured trial to evaluate everything before committing.',
    color: 'border-blue-300',
    headerBg: 'bg-blue-50',
    cta: 'Start Trial',
    ctaClass: 'bg-blue-600 text-white hover:bg-blue-700',
    features: [
      { label: 'Farmers', value: 'Up to 3' },
      { label: 'Retailers', value: 'Up to 3' },
      { label: 'Milk Collection', value: true },
      { label: 'Milk Delivery', value: true },
      { label: 'Billing & Invoices', value: true },
      { label: 'Reports', value: false },
      { label: 'Accounts (P&L)', value: false },
      { label: 'Transport', value: false },
      { label: 'Staff Management', value: false },
      { label: 'Multi-User', value: false },
      { label: 'WhatsApp Notifications', value: true },
      { label: 'PDF / Excel Export', value: true },
    ],
  },
  {
    key: 'BASIC',
    name: 'Basic',
    price: 2500,
    period: 'month',
    badge: null,
    description: 'For small dairy operations with up to 10 farmers and retailers.',
    color: 'border-green-300',
    headerBg: 'bg-green-50',
    cta: 'Get Basic',
    ctaClass: 'bg-green-600 text-white hover:bg-green-700',
    features: [
      { label: 'Farmers', value: 'Up to 10' },
      { label: 'Retailers', value: 'Up to 10' },
      { label: 'Milk Collection', value: true },
      { label: 'Milk Delivery', value: true },
      { label: 'Billing & Invoices', value: true },
      { label: 'Reports', value: true },
      { label: 'Accounts (P&L)', value: false },
      { label: 'Transport', value: false },
      { label: 'Staff Management', value: false },
      { label: 'Multi-User', value: false },
      { label: 'WhatsApp Notifications', value: true },
      { label: 'PDF / Excel Export', value: true },
    ],
  },
  {
    key: 'STANDARD',
    name: 'Standard',
    price: 5000,
    period: 'month',
    badge: 'Most Popular',
    description: 'For growing businesses with up to 50 farmers and retailers.',
    color: 'border-purple-400 shadow-xl scale-[1.02]',
    headerBg: 'bg-purple-50',
    cta: 'Get Standard',
    ctaClass: 'bg-purple-600 text-white hover:bg-purple-700',
    features: [
      { label: 'Farmers', value: 'Up to 50' },
      { label: 'Retailers', value: 'Up to 50' },
      { label: 'Milk Collection', value: true },
      { label: 'Milk Delivery', value: true },
      { label: 'Billing & Invoices', value: true },
      { label: 'Reports', value: true },
      { label: 'Accounts (P&L)', value: true },
      { label: 'Transport', value: true },
      { label: 'Staff Management', value: true },
      { label: 'Multi-User', value: false },
      { label: 'WhatsApp Notifications', value: true },
      { label: 'PDF / Excel Export', value: true },
    ],
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 9000,
    period: 'month',
    badge: '👑 Enterprise',
    description: 'Unlimited farmers and retailers with multi-user collaboration.',
    color: 'border-amber-400',
    headerBg: 'bg-amber-50',
    cta: 'Get Premium',
    ctaClass: 'bg-amber-600 text-white hover:bg-amber-700',
    features: [
      { label: 'Farmers', value: 'Unlimited' },
      { label: 'Retailers', value: 'Unlimited' },
      { label: 'Milk Collection', value: true },
      { label: 'Milk Delivery', value: true },
      { label: 'Billing & Invoices', value: true },
      { label: 'Reports', value: true },
      { label: 'Accounts (P&L)', value: true },
      { label: 'Transport', value: true },
      { label: 'Staff Management', value: true },
      { label: 'Multi-User', value: true },
      { label: 'WhatsApp Notifications', value: true },
      { label: 'PDF / Excel Export', value: true },
    ],
  },
];

const FAQ = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. The new plan takes effect from the next billing cycle.',
  },
  {
    q: 'What happens when my trial expires?',
    a: 'After the 14-day trial, the system becomes read-only. Your data is preserved and you can upgrade to a paid plan to restore full access.',
  },
  {
    q: 'Is payment required to start the trial?',
    a: 'No. You can start the free 14-day trial immediately with no credit card required.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bank transfer, EasyPaisa, JazzCash, and cheque payments. Contact us after signing up to arrange payment.',
  },
  {
    q: 'Can I add more users on the Standard plan?',
    a: 'The Standard plan is single-user. Upgrade to Premium to add multiple team members with role-based access control.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Each organization has fully isolated data. All data is stored in a secure cloud database with daily backups.',
  },
];

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span className="text-green-600 font-bold">✓</span>
    : <span className="text-gray-300">—</span>;
}

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600">
            Start free. Scale as you grow. No hidden fees — ever.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-10 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 items-start">
            {PLANS.map((plan) => (
              <div key={plan.key}
                className={`rounded-2xl border-2 ${plan.color} overflow-hidden flex flex-col`}>
                <div className={`${plan.headerBg} px-6 py-5`}>
                  {plan.badge && (
                    <div className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full w-fit mb-2">
                      {plan.badge}
                    </div>
                  )}
                  <h2 className="text-xl font-extrabold text-gray-900">{plan.name}</h2>
                  <div className="mt-2">
                    {plan.price === 0
                      ? <span className="text-3xl font-extrabold text-gray-900">Free</span>
                      : <>
                          <span className="text-3xl font-extrabold text-gray-900">
                            ₨{plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">/{plan.period}</span>
                        </>
                    }
                  </div>
                  {plan.period !== 'forever' && plan.price === 0 && (
                    <div className="text-xs text-gray-500 mt-0.5">{plan.period} free</div>
                  )}
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{plan.description}</p>
                </div>
                <div className="px-6 py-5 flex-1 flex flex-col justify-between">
                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-700">{f.label}</span>
                        {typeof f.value === 'boolean'
                          ? <Check ok={f.value} />
                          : <span className="text-gray-900 font-medium text-xs">{f.value}</span>
                        }
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup"
                    className={`block text-center py-2.5 rounded-xl text-sm font-bold transition-colors ${plan.ctaClass}`}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            All prices are in Pakistani Rupees (PKR) · Monthly billing · Cancel anytime
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">Start for Free Today</h2>
          <p className="text-green-100 mb-8">14-day trial · All features unlocked · No card required</p>
          <Link href="/signup"
            className="inline-block px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg">
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
