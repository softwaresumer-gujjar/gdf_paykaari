import Link from 'next/link';

const MODULES = [
  {
    id: 'farmers',
    icon: '🌾',
    title: 'Farmer Management',
    color: 'green',
    badge: 'Core',
    headline: 'Full lifecycle management for your farmer network',
    features: [
      'Yearly contracts with fixed daily committed quantities',
      'Fixed rate per maund with auto-renewal alerts',
      'Morning and evening session bulk entry form',
      'Fat percentage & water-adulteration quality testing',
      'Auto-calculate shortfall penalty at market rate',
      'Auto-calculate excess bonus at open market rate',
      'Farmer profile with contact details and history',
      'Contract start/end date tracking',
      'WhatsApp / Email / SMS report delivery',
      'Quality pass/fail tracking per entry',
    ],
  },
  {
    id: 'retailers',
    icon: '🏪',
    title: 'Retailer Management',
    color: 'blue',
    badge: 'Core',
    headline: 'Track every litre sold to every retailer',
    features: [
      'Yearly supply agreements with committed quantities',
      'Fixed sale rate per maund',
      'Morning & evening delivery bulk entry',
      'Auto transport surcharge (PKR 300/maund) on excess',
      'Excess purchase charged at market rate + surcharge',
      'Retailer profiles with payment history',
      'Overdue balance alerts',
      'Delivery confirmation with tank tracking',
      'Retailer-wise billing and statement reports',
      'Invoice PDF sent via WhatsApp / Email',
    ],
  },
  {
    id: 'collection',
    icon: '🥛',
    title: 'Milk Collection',
    color: 'indigo',
    badge: 'Core',
    headline: 'Record and verify every collection entry',
    features: [
      'Daily bulk entry grid for all farmers at once',
      'Morning and evening session separation',
      'Quality tests: fat %, water adulteration, pass/fail',
      'Collection summary by date and session',
      'Collection vs contracted comparison',
      'Historical entry browser with search and filter',
      'Export collection data to Excel',
    ],
  },
  {
    id: 'delivery',
    icon: '🚛',
    title: 'Milk Delivery',
    color: 'cyan',
    badge: 'Core',
    headline: 'Track every delivery from tank to retailer',
    features: [
      'Daily delivery grid for all retailers',
      'Session-based (morning / evening) delivery entry',
      'Delivery summary by date',
      'Delivered vs committed comparison',
      'Historical delivery browser',
      'Excel export for delivery records',
    ],
  },
  {
    id: 'market-rates',
    icon: '📈',
    title: 'Market Rates',
    color: 'amber',
    badge: 'Core',
    headline: 'Set the open market rate twice daily',
    features: [
      'Set morning and evening market rate per day',
      'Rates auto-applied to excess/shortfall calculations',
      'Rate history with trend chart (30-day view)',
      'Date-specific rate lookup for invoice generation',
      'Rate changes flagged in notifications',
    ],
  },
  {
    id: 'billing',
    icon: '🧾',
    title: 'Billing & Invoices',
    color: 'purple',
    badge: 'Standard+',
    headline: 'One-click invoice generation for the entire network',
    features: [
      'Generate farmer invoices for any date (all farmers at once)',
      'Generate retailer invoices in one click',
      'Farmer invoice: base amount – shortfall + excess bonus',
      'Retailer invoice: base amount + excess surcharge',
      'Mark invoices as paid with payment mode & reference',
      'PDF invoice with your logo, signature & bank details',
      'Excel export of all invoices',
      'Filter by date range, farmer/retailer, paid/unpaid',
      'Monthly billing summary with outstanding totals',
      'Pagination for large invoice histories',
    ],
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Payments',
    color: 'teal',
    badge: 'Standard+',
    headline: 'Full payment tracking for in and outflows',
    features: [
      'Record advance payments to farmers',
      'Record payments received from retailers',
      'Payment modes: Cash, Cheque, Bank Transfer, Online',
      'Payment history with date and reference',
      'Receivables and payables summary',
      'Overdue payment alerts',
    ],
  },
  {
    id: 'transport',
    icon: '🛣️',
    title: 'Transport & Trips',
    color: 'orange',
    badge: 'Standard+',
    headline: 'Full trip and tank lifecycle tracking',
    features: [
      'Create transport trips with driver assignment',
      'Record stops during each trip',
      'Track travel time farm-to-retail',
      'Tank management (40L maund containers)',
      'Complete trip with timestamp',
      'Trip history with audit trail',
    ],
  },
  {
    id: 'staff',
    icon: '👥',
    title: 'Staff Management',
    color: 'pink',
    badge: 'Standard+',
    headline: 'Manage your entire field team',
    features: [
      'Driver and helper profiles',
      'Monthly salary tracking',
      'Designation and department management',
      'Payroll summary report',
      'Staff-wise payment history',
    ],
  },
  {
    id: 'scheduler',
    icon: '🗓️',
    title: 'Scheduler & Reminders',
    color: 'violet',
    badge: 'All Plans',
    headline: 'Automated reminders so nothing slips through',
    features: [
      'Schedule recurring tasks (daily, weekly, monthly)',
      'Auto-trigger notifications on due dates',
      'Payment reminder schedules for retailers',
      'Farmer payment calendar reminders',
      'Subscription renewal reminders',
      'Custom reminder titles and messages',
    ],
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Reports & Analytics',
    color: 'emerald',
    badge: 'Basic+',
    headline: 'Data-driven decisions for your business',
    features: [
      'Collection report (by date range, session, farmer)',
      'Delivery report (by date range, session, retailer)',
      'Quality report (fat % and pass rate trends)',
      'Payment report (in/out cash flow)',
      'Balance report (net daily position)',
      'Receivables aging report',
      'Profit & Loss statement',
      'Balance Sheet (assets vs liabilities)',
      'PDF and Excel export for all reports',
    ],
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Notifications',
    color: 'red',
    badge: 'All Plans',
    headline: 'Multi-channel alerts for your entire team',
    features: [
      'In-app notification center with unread badge',
      'WhatsApp message delivery',
      'Email notification delivery',
      'SMS alerts',
      'Channel filter (WhatsApp / Email / In-app)',
      'Mark as read / mark all read',
      'Real-time push via WebSocket',
    ],
  },
  {
    id: 'users',
    icon: '👤',
    title: 'Multi-User Access',
    color: 'slate',
    badge: 'Premium',
    headline: 'Role-based access for your entire organization',
    features: [
      'Invite team members via email link',
      'Roles: Admin, Manager, Viewer, Driver',
      'Granular page-level permission control',
      'Admin-only: user management, subscription',
      'Manager: all operations + billing',
      'Driver: collection and delivery entry only',
      'Block / unblock team members',
      'Password reset by admin',
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Organization Settings',
    color: 'gray',
    badge: 'All Plans',
    headline: 'Fully white-labeled for your brand',
    features: [
      'Custom business name, logo, and tagline',
      'Brand color theming',
      'Invoice header, footer, and terms',
      'Signature image upload',
      'Bank account details on invoices',
      'Business address, phone, email, website',
      'Tax ID / NTN field',
    ],
  },
  {
    id: 'multitenancy',
    icon: '🏢',
    title: 'Multi-Tenancy',
    color: 'blue',
    badge: 'All Plans',
    headline: 'Each customer gets their own isolated workspace',
    features: [
      'Fully isolated data per organization',
      'Separate subscription per organization',
      'Custom branding per tenant',
      'Tenant-aware all API endpoints',
      'No cross-tenant data leakage',
      'Scale to thousands of tenants',
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   badge: 'bg-green-100 text-green-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    badge: 'bg-teal-100 text-teal-700' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    badge: 'bg-pink-100 text-pink-700' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   badge: 'bg-slate-100 text-slate-700' },
  gray:    { bg: 'bg-gray-50',    text: 'text-gray-700',    border: 'border-gray-200',    badge: 'bg-gray-100 text-gray-600' },
};

export default function ProductsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5">
            Everything You Need to Run<br className="hidden sm:block" /> a Modern Dairy Business
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            MilkFlow covers every workflow — from farm-gate collection to retail billing —
            with powerful automations, real-time insights, and multi-channel communication.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md">
            Start Free 14-Day Trial →
          </Link>
        </div>
      </section>

      {/* Module grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {MODULES.map((mod) => {
              const c = COLOR_MAP[mod.color] ?? COLOR_MAP.gray;
              return (
                <div key={mod.id}
                  className={`rounded-2xl border ${c.border} ${c.bg} p-8`}>
                  <div className="flex flex-wrap items-start gap-4 mb-5">
                    <span className="text-4xl">{mod.icon}</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h2 className={`text-xl font-bold text-gray-900`}>{mod.title}</h2>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{mod.badge}</span>
                      </div>
                      <p className={`text-sm font-medium ${c.text}`}>{mod.headline}</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {mod.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`mt-0.5 text-xs font-bold ${c.text} flex-shrink-0`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to unlock all features?</h2>
          <p className="text-gray-400 mb-8">Start with a free trial, upgrade when you&apos;re ready.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
              Start Free Trial
            </Link>
            <Link href="/pricing"
              className="px-8 py-4 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:border-gray-500 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
