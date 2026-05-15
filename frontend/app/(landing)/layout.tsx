'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const MORE_ITEMS = [
  { label: 'Farmer Management', desc: 'Contracts, quality testing & penalties', href: '/products#farmers' },
  { label: 'Retailer Management', desc: 'Supply agreements & invoicing', href: '/products#retailers' },
  { label: 'Milk Collection', desc: 'Bulk entry & quality tests', href: '/products#collection' },
  { label: 'Milk Delivery', desc: 'Session tracking & summaries', href: '/products#delivery' },
  { label: 'Billing & Payments', desc: 'Invoices, PDF export & payment flows', href: '/products#billing' },
  { label: 'Reports & Analytics', desc: 'P&L, balance sheet & insights', href: '/products#reports' },
  { label: 'Staff Management', desc: 'Drivers, helpers & payroll', href: '/products#staff' },
  { label: 'Notifications', desc: 'WhatsApp, Email, SMS & in-app', href: '/products#notifications' },
];

function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: '/home', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900 text-lg">MilkFlow</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}>
                {l.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${moreOpen ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                More
                <svg className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 grid grid-cols-2 gap-1">
                  <div className="col-span-2 mb-2 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Our Products</span>
                    <Link href="/products" onClick={() => setMoreOpen(false)}
                      className="text-xs font-medium text-green-600 hover:text-green-700">
                      View all →
                    </Link>
                  </div>
                  {MORE_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                      className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors group">
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700">{item.label}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm">
              Start Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button type="button" className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-green-600">
              {l.label}
            </Link>
          ))}

          {/* Mobile More section */}
          <div>
            <button
              type="button"
              onClick={() => setMobileMoreOpen((v) => !v)}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 hover:text-green-600"
            >
              <span>More</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${mobileMoreOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileMoreOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l-2 border-green-100 pl-3">
                {MORE_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }}
                    className="block py-1.5 text-sm text-gray-600 hover:text-green-600">
                    {item.label}
                  </Link>
                ))}
                <Link href="/products" onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }}
                  className="block py-1.5 text-sm font-medium text-green-600">
                  View all products →
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link href="/login" className="block py-2 text-sm font-medium text-gray-700">Sign in</Link>
            <Link href="/signup"
              className="block py-2 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg text-center">
              Start Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
              <span className="font-bold text-white text-lg">MilkFlow</span>
            </div>
            <p className="text-sm leading-relaxed">Modern SaaS for milk collection &amp; distribution businesses — built for Pakistan&apos;s dairy industry.</p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white hover:bg-green-600 transition-colors text-sm">
                W
              </a>
              <a href="mailto:info@milkflow.pk"
                className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors text-sm">
                @
              </a>
              <a href="https://www.facebook.com/milkflow" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white hover:bg-blue-700 transition-colors text-sm">
                f
              </a>
              <a href="https://www.instagram.com/milkflow" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-pink-800 flex items-center justify-center text-white hover:bg-pink-700 transition-colors text-sm">
                IG
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:info@milkflow.pk" className="hover:text-white transition-colors">info@milkflow.pk</a></li>
              <li><a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              <li className="text-gray-500">Lahore, Pakistan</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} MilkFlow. All rights reserved.</span>
          <span>Made with ♥ in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="pt-16">{children}</div>
      <Footer />
    </div>
  );
}
