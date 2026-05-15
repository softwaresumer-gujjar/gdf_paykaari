import Link from 'next/link';

const USE_CASES = [
  {
    icon: '🌾',
    title: 'Farmer Management',
    desc: 'Track yearly contracts, daily collection entries, fat percentage, water testing, and auto-calculate shortfall penalties or excess bonuses.',
  },
  {
    icon: '🏪',
    title: 'Retailer Management',
    desc: 'Manage retailer commitments, track daily deliveries, apply transport surcharges on excess purchases, and generate retailer invoices.',
  },
  {
    icon: '🚚',
    title: 'Route & Transport',
    desc: 'Monitor trip stops, travel times, assign tanks, and track milk from farm gate to retail shelf with full traceability.',
  },
  {
    icon: '🧾',
    title: 'Billing & Invoices',
    desc: 'Generate daily invoices for farmers and retailers at the click of a button. Export professional PDF invoices with your branding.',
  },
  {
    icon: '📊',
    title: 'Reports & Analytics',
    desc: 'Collection reports, delivery summaries, quality reports, profit & loss, balance sheet, and receivables — all with Excel/PDF export.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Auto-reminders for payment due dates, subscription renewal, and operational alerts via in-app, WhatsApp, Email, and SMS.',
  },
];

const STATS = [
  { value: '10x', label: 'Faster Billing' },
  { value: '100%', label: 'Digital Records' },
  { value: '24/7', label: 'Accessible' },
  { value: '0', label: 'Paper Required' },
];

const TESTIMONIALS = [
  {
    name: 'Ahmad Raza',
    role: 'Dairy Business Owner, Lahore',
    quote: 'MilkFlow transformed our billing from 3 hours of manual work to 5 minutes. Our farmers now receive their payment details via WhatsApp automatically.',
  },
  {
    name: 'Farhan Enterprises',
    role: 'Milk Distributor, Faisalabad',
    quote: 'Managing 50+ farmers and 30 retailers was a nightmare in Excel. MilkFlow handles everything — collections, deliveries, invoices, and accounts.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 lg:py-32">
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
              🥛 Built for Pakistan&apos;s Dairy Industry
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Manage Your Milk Business<br />
              <span className="text-green-600">Smarter &amp; Faster</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              MilkFlow is the all-in-one SaaS platform for milk collection and distribution businesses.
              Automate billing, track deliveries, manage farmers &amp; retailers, and get real-time insights — all from one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-xl text-base hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform">
                Start Free Trial
              </Link>
              <Link href="/products"
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl text-base hover:border-green-300 hover:text-green-700 transition-all">
                See All Features →
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-4">No credit card required · Free 14-day trial · Cancel anytime</p>
          </div>

          {/* App preview mockup */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-500">MilkFlow Dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Collected Today', value: '1,240 maunds', color: 'bg-green-900/40 text-green-400' },
                  { label: 'Delivered Today', value: '1,210 maunds', color: 'bg-blue-900/40 text-blue-400' },
                  { label: 'Unpaid Invoices', value: '₨ 82,500', color: 'bg-amber-900/40 text-amber-400' },
                  { label: 'Active Farmers', value: '28', color: 'bg-purple-900/40 text-purple-400' },
                ].map((card) => (
                  <div key={card.label} className={`${card.color} rounded-xl p-4 text-center`}>
                    <div className="text-lg font-bold">{card.value}</div>
                    <div className="text-xs mt-1 opacity-75">{card.label}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Recent Collections</div>
                  {[
                    ['Ahmad Farm', '18 maunds', 'Morning', 'text-green-400'],
                    ['Khan Dairy', '22 maunds', 'Morning', 'text-green-400'],
                    ['Rehman Farms', '15 maunds', 'Evening', 'text-blue-400'],
                  ].map(([name, qty, session, color]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                      <span className="text-sm text-gray-300">{name}</span>
                      <span className="text-sm font-medium text-gray-300">{qty}</span>
                      <span className={`text-xs font-medium ${color}`}>{session}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-white">{s.value}</div>
                <div className="text-green-100 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Everything Your Dairy Business Needs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From farm collection to retail delivery — MilkFlow covers every part of your operation.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {USE_CASES.map((uc) => (
              <div key={uc.title}
                className="group p-7 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all bg-white">
                <div className="text-3xl mb-4">{uc.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{uc.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors">
              View All Features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Get Started in Minutes</h2>
            <p className="text-lg text-gray-600">No technical knowledge required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up Free', desc: 'Create your account and set up your organization in under 5 minutes. No credit card needed.' },
              { step: '02', title: 'Add Your Data', desc: 'Import your farmers, retailers, and market rates. Our onboarding wizard guides you step by step.' },
              { step: '03', title: 'Go Live', desc: 'Start recording collections, generating invoices, and sharing reports with your team — all in one click.' },
            ].map((item) => (
              <div key={item.step} className="relative p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-5xl font-extrabold text-green-100 mb-4">{item.step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Trusted by Dairy Businesses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-700 text-base leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-green-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Digitize Your Dairy Business?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Join hundreds of milk businesses across Pakistan who trust MilkFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-xl text-base hover:bg-green-50 transition-all shadow-lg">
              Start Your Free Trial
            </Link>
            <Link href="/contact"
              className="w-full sm:w-auto px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-xl text-base hover:border-white transition-all">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
