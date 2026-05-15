'use client';

import { useState } from 'react';

const CONTACT_CHANNELS = [
  {
    icon: '💬',
    title: 'WhatsApp',
    desc: 'Chat with us directly. Fastest response.',
    action: 'Open WhatsApp',
    href: 'https://wa.me/923001234567?text=Hi%2C%20I%27m%20interested%20in%20MilkFlow.',
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    btnClass: 'bg-green-600 hover:bg-green-700 text-white',
    detail: '+92 300 123 4567',
  },
  {
    icon: '📧',
    title: 'Email',
    desc: 'Send us an email. We reply within 24 hours.',
    action: 'Send Email',
    href: 'mailto:info@milkflow.pk?subject=MilkFlow%20Inquiry',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    detail: 'info@milkflow.pk',
  },
  {
    icon: '📞',
    title: 'Phone',
    desc: 'Call us during business hours (9am–6pm PKT).',
    action: 'Call Now',
    href: 'tel:+923001234567',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    detail: '+92 300 123 4567',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">
            Have questions about MilkFlow? We&apos;re here to help. Choose the channel that works best for you.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left: channels + form */}
          <div className="space-y-8">
            {/* Quick contact channels */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Reach Us Directly</h2>
              <div className="space-y-4">
                {CONTACT_CHANNELS.map((ch) => (
                  <div key={ch.title}
                    className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all ${ch.color}`}>
                    <span className="text-3xl flex-shrink-0">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{ch.title}</div>
                      <div className="text-sm text-gray-600">{ch.desc}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{ch.detail}</div>
                    </div>
                    <a href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${ch.btnClass}`}>
                      {ch.action}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Business info */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">Business Hours</h3>
              {[
                ['Monday – Friday', '9:00 AM – 6:00 PM PKT'],
                ['Saturday', '10:00 AM – 2:00 PM PKT'],
                ['Sunday', 'Closed'],
              ].map(([day, hours]) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-gray-600">{day}</span>
                  <span className="text-gray-900 font-medium">{hours}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
                📍 Lahore, Punjab, Pakistan
              </div>
            </div>
          </div>

          {/* Right: contact form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 text-sm max-w-xs">
                  Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button type="button" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  className="mt-6 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input id="c-name" required value={form.name} onChange={(e) => set('name', e.target.value)}
                      placeholder="Ahmad Raza"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Phone</label>
                    <input id="c-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+92 300 000 0000"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input id="c-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="c-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select id="c-subject" required value={form.subject} onChange={(e) => set('subject', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select a subject…</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing Question</option>
                    <option value="trial">Start a Trial</option>
                    <option value="support">Technical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="c-message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea id="c-message" rows={5} required value={form.message} onChange={(e) => set('message', e.target.value)}
                    placeholder="Tell us about your dairy business and how we can help…"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors">
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
