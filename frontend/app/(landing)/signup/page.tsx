'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const PLANS = [
  { key: 'FREE',     name: 'Free',     price: 0,    desc: '2 farmers / 2 retailers · No billing',       color: 'border-gray-300',   badge: '' },
  { key: 'TRIAL',    name: 'Trial',    price: 0,    desc: '14-day free trial · All features included',  color: 'border-blue-400',   badge: 'Recommended' },
  { key: 'BASIC',    name: 'Basic',    price: 2500, desc: '10 farmers / 10 retailers · PKR 2,500/mo',   color: 'border-green-400',  badge: '' },
  { key: 'STANDARD', name: 'Standard', price: 5000, desc: '50 farmers / 50 retailers · PKR 5,000/mo',  color: 'border-purple-500', badge: 'Popular' },
  { key: 'PREMIUM',  name: 'Premium',  price: 9000, desc: 'Unlimited · Multi-user · PKR 9,000/mo',     color: 'border-amber-500',  badge: '' },
];

interface Step1 { plan: string }
interface Step2 { orgName: string; orgPhone: string; orgCity: string; orgAddress: string }
interface Step3 { name: string; email: string; password: string; confirm: string }

const STEPS = ['Choose Plan', 'Organization', 'Your Account', 'Confirmation'];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<Step1>({ plan: 'TRIAL' });
  const [step2, setStep2] = useState<Step2>({ orgName: '', orgPhone: '', orgCity: '', orgAddress: '' });
  const [step3, setStep3] = useState<Step3>({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (step3.password !== step3.confirm) { setError('Passwords do not match'); return; }
    if (step3.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await authApi.register({
        name: step3.name,
        email: step3.email,
        password: step3.password,
        organizationName: step2.orgName,
      });
      setStep(3);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed. Please try again.';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        {step < 3 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? 'bg-green-600 text-white' :
                    i === step ? 'bg-green-600 text-white ring-4 ring-green-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-1 transition-all ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">{STEPS[step]}</div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Step 0 — Choose plan */}
          {step === 0 && (
            <div className="p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Choose Your Plan</h2>
              <p className="text-gray-500 text-sm mb-6">You can change your plan anytime.</p>
              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <label key={plan.key}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      step1.plan === plan.key
                        ? 'border-green-500 bg-green-50'
                        : `${plan.color} hover:border-green-300`
                    }`}>
                    <input type="radio" name="plan" value={plan.key}
                      checked={step1.plan === plan.key}
                      onChange={() => setStep1({ plan: plan.key })}
                      className="w-4 h-4 accent-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                        {plan.badge && (
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{plan.desc}</div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {plan.price === 0 ? 'Free' : `₨${plan.price.toLocaleString()}/mo`}
                    </span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={next}
                className="mt-6 w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
                Continue →
              </button>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or sign up faster</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <a
                href={authApi.googleAuthUrl()}
                className="mt-3 flex items-center justify-center gap-2.5 w-full border border-gray-300 rounded-xl py-3 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </a>

              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 1 — Organization */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Your Business</h2>
              <p className="text-gray-500 text-sm mb-6">This information appears on your invoices.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="s-orgname" className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input id="s-orgname" required value={step2.orgName} onChange={(e) => setStep2((p) => ({ ...p, orgName: e.target.value }))}
                    placeholder="GDF Milk Distributors"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-phone" className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                  <input id="s-phone" value={step2.orgPhone} onChange={(e) => setStep2((p) => ({ ...p, orgPhone: e.target.value }))}
                    placeholder="+92 300 000 0000"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input id="s-city" value={step2.orgCity} onChange={(e) => setStep2((p) => ({ ...p, orgCity: e.target.value }))}
                    placeholder="Lahore"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-addr" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea id="s-addr" rows={2} value={step2.orgAddress} onChange={(e) => setStep2((p) => ({ ...p, orgAddress: e.target.value }))}
                    placeholder="Street, Area, City"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button type="button" onClick={() => { if (!step2.orgName.trim()) return; next(); }}
                  disabled={!step2.orgName.trim()}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Your Account</h2>
              <p className="text-gray-500 text-sm mb-6">This will be the administrator account.</p>
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="s-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input id="s-name" required value={step3.name} onChange={(e) => setStep3((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ahmad Raza"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input id="s-email" type="email" required value={step3.email} onChange={(e) => setStep3((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-pass" className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input id="s-pass" type="password" required value={step3.password} onChange={(e) => setStep3((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="s-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input id="s-confirm" type="password" required value={step3.confirm} onChange={(e) => setStep3((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-gray-700 mb-2">Summary</div>
                <div className="flex justify-between"><span>Plan</span><span className="font-medium text-gray-900">{PLANS.find((p) => p.key === step1.plan)?.name}</span></div>
                <div className="flex justify-between"><span>Organization</span><span className="font-medium text-gray-900">{step2.orgName}</span></div>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={back}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button type="button" onClick={submit}
                  disabled={loading || !step3.name || !step3.email || !step3.password || !step3.confirm}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                By creating an account you agree to our Terms of Service.
              </p>
            </div>
          )}

          {/* Step 3 — Confirmation */}
          {step === 3 && (
            <div className="p-10 text-center">
              <div className="text-6xl mb-5">🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Welcome to MilkFlow!</h2>
              <p className="text-gray-600 mb-2">
                Your account for <strong>{step2.orgName}</strong> has been created successfully.
              </p>
              {step1.plan === 'TRIAL' && (
                <div className="mt-4 mb-6 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                  Your 14-day free trial has started. Explore all features!
                </div>
              )}
              {(step1.plan === 'BASIC' || step1.plan === 'STANDARD' || step1.plan === 'PREMIUM') && (
                <div className="mt-4 mb-6 inline-block px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  To activate your {PLANS.find((p) => p.key === step1.plan)?.name} plan, please complete payment.
                  Our team will contact you within 24 hours with payment instructions.
                </div>
              )}
              <div className="space-y-3">
                <button type="button" onClick={() => router.push('/login')}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
                  Sign In to Your Account →
                </button>
                <Link href="/products"
                  className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Explore features first
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
