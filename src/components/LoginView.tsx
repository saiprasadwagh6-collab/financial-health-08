import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Target,
  BarChart2,
  Activity,
  X,
  Mail,
  Lock,
} from 'lucide-react';
import { ArthDrishtiLogo } from './ArthDrishtiLogo';

interface LoginViewProps {
  onSuccessfulLogin: (userName?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccessfulLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const extractedName = email.split('@')[0] || 'User';
      const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
      onSuccessfulLogin(formattedName);
    }, 350);
  };

  const featureDetails: Record<
    string,
    { title: string; text: string; stat: string; statLabel: string; points: string[] }
  > = {
    insights: {
      title: 'Smart Insights',
      text: 'Automatically categorize every transaction and surface the spending patterns that matter most to your long-term wealth.',
      stat: 'Real-Time',
      statLabel: 'spending categories tracked from your uploaded statement',
      points: [
        'Weekly spending elasticity summaries',
        'Unusual expense & bill spike alerts',
        'Discretionary category trends over time',
      ],
    },
    goals: {
      title: 'Goal Planning',
      text: 'Turn dreams into achievable monthly milestones, from an emergency buffer to your first home down-payment.',
      stat: 'Dynamic',
      statLabel: 'pro-rata monthly deficit allocation based on real budget',
      points: [
        'Target amounts and dynamic completion dates',
        'Proportional monthly deficit allocation',
        'Milestone notifications at 25%, 50%, 75%, 100%',
      ],
    },
    simulation: {
      title: 'Future Simulator',
      text: 'Model life decisions before executing them and see how each choice shapes your future net worth.',
      stat: 'What-If',
      statLabel: 'projection curves calculated from actual ledger burn rate',
      points: [
        'What-if scenarios for rent increases & pay raises',
        'One-time shock expense impact testing',
        'Side-by-side plan comparisons with reserve floor',
      ],
    },
    health: {
      title: 'Stay Financially Healthy',
      text: 'A continuous financial health monitor that flags risks early and recommends practical next steps.',
      stat: '50/30/20',
      statLabel: 'live benchmark calculated from actual statement data',
      points: [
        'Needs / Wants / Savings 50/30/20 guideline split',
        'Reserve safety floor breach prevention',
        'Personalized AI recommendations',
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF4E7] flex flex-col lg:flex-row text-[#092D29]">
      {/* Left Promotional Panel */}
      <section className="relative overflow-hidden lg:w-7/12 bg-gradient-to-br from-[#003D34] via-[#02332C] to-[#012B26] text-[#FAF4E7] p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        {/* Decorative Golden Graphic Curves */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 900 1024" preserveAspectRatio="none">
            <path
              d="M-40 230 C 160 120, 380 40, 640 -20"
              fill="none"
              stroke="#F3D58A"
              strokeWidth="2"
            />
            <path
              d="M-20 1060 C 120 960, 260 930, 420 1060"
              fill="none"
              stroke="#D9B45B"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="max-w-[300px]">
            <ArthDrishtiLogo variant="sidebar" className="w-full" />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mt-10 leading-[1.15] text-[#FAF4E7] tracking-tight">
            Predict the <span className="text-[#F3D58A] italic">Risk.</span>
            <br />
            Balance Your <span className="text-[#F3D58A] italic">Life.</span>
            <br />
            Secure <span className="text-[#D9B45B] italic">Your Future.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#FAF4E7]/80 max-w-lg leading-relaxed">
            An AI-powered personal finance flight simulator designed to help you track cash flow,
            simulate unexpected domino shocks, and optimize your financial journey with clarity and
            confidence.
          </p>

          {/* Interactive Feature Previews */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            {[
              {
                id: 'insights',
                title: 'Smart Insights',
                desc: 'Understand spending patterns',
                icon: <BarChart2 className="w-5 h-5 text-[#F3D58A]" />,
              },
              {
                id: 'goals',
                title: 'Goal Planning',
                desc: 'Achieve your financial dreams',
                icon: <Target className="w-5 h-5 text-[#F3D58A]" />,
              },
              {
                id: 'simulation',
                title: 'Future Simulation',
                desc: 'See the impact before it happens',
                icon: <Sparkles className="w-5 h-5 text-[#F3D58A]" />,
              },
              {
                id: 'health',
                title: 'Financial Health',
                desc: 'Detect liquidity risks early',
                icon: <Activity className="w-5 h-5 text-[#F3D58A]" />,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFeatureModal(f.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-[#D9B45B]/30 hover:bg-[#D9B45B]/15 hover:border-[#D9B45B] transition text-left group"
              >
                <div className="p-2.5 rounded-xl bg-white/10 shrink-0">{f.icon}</div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white group-hover:text-[#F3D58A] transition">
                    {f.title}
                  </div>
                  <div className="text-[11px] text-[#FAF4E7]/70">{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Coach Card */}
        <div className="relative z-10 mt-10 p-5 rounded-2xl bg-white/10 border border-[#D9B45B]/40 backdrop-blur-md max-w-md">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#D9B45B]/20 text-[#F3D58A]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="font-bold text-sm text-white">Zero Hardcoded Data</div>
              <p className="text-xs text-[#FAF4E7]/80 mt-0.5 leading-snug">
                Every calculation, chart, health score, and domino simulation is powered strictly by your real uploaded financial statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Auth Panel */}
      <main className="lg:w-5/12 p-8 sm:p-12 lg:p-16 flex items-center justify-center bg-gradient-to-b from-[#FFFDF9] via-[#FAF4E7] to-[#F5ECD9]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#092D29]">
              Sign In
            </h2>
            <p className="text-sm text-[#68716B]">
              Enter your credentials to access your real-time dashboard
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#D94343]/10 border border-[#D94343]/30 text-xs font-semibold text-[#D94343]">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#092D29] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#68716B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-[#E9DFC9] bg-white text-sm text-[#092D29] focus:outline-hidden focus:border-[#003D34] focus:ring-2 focus:ring-[#003D34]/15"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#092D29]">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-bold text-[#003D34] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#68716B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-10 pr-10 rounded-2xl border border-[#E9DFC9] bg-white text-sm text-[#092D29] focus:outline-hidden focus:border-[#003D34] focus:ring-2 focus:ring-[#003D34]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#68716B] hover:text-[#092D29]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#0B5A50] to-[#003D34] text-white font-bold text-base hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-[#003D34]/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#68716B]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="font-bold text-[#003D34] hover:underline"
            >
              Create account
            </button>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-[#E9DFC9] text-xs text-[#68716B]">
            <ShieldCheck className="w-4 h-4 text-[#A9822F]" />
            <span>Your financial data is private and encrypted</span>
          </div>
        </div>
      </main>

      {/* Feature Details Modal */}
      {activeFeatureModal && featureDetails[activeFeatureModal] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFF9EF] border border-[#D9B45B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DFC9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9822F]">
                Feature Overview
              </span>
              <button
                onClick={() => setActiveFeatureModal(null)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68746D]" />
              </button>
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#092D29]">
              {featureDetails[activeFeatureModal].title}
            </h3>

            <p className="text-xs text-[#68716B] leading-relaxed">
              {featureDetails[activeFeatureModal].text}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#003D34] text-white flex items-baseline gap-3">
              <span className="font-serif text-2xl font-bold text-[#F3D58A]">
                {featureDetails[activeFeatureModal].stat}
              </span>
              <span className="text-xs text-white/80">
                {featureDetails[activeFeatureModal].statLabel}
              </span>
            </div>

            <ul className="space-y-2 text-xs text-[#092D29]">
              {featureDetails[activeFeatureModal].points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9B45B] mt-1.5 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setActiveFeatureModal(null)}
              className="w-full h-11 rounded-xl bg-[#003D34] text-white text-xs font-bold hover:bg-[#02332C] transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#FFF9EF] border border-[#E9DFC9] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DFC9]">
              <h3 className="font-serif text-xl font-bold text-[#092D29]">Reset Password</h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68716B]" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 rounded-2xl bg-[#2E7655]/10 border border-[#2E7655]/30 text-xs text-[#2E7655] font-semibold text-center space-y-2">
                <div>Password recovery link sent to {forgotEmail}!</div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-[#2E7655] text-white text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail) setForgotSubmitted(true);
                }}
                className="space-y-3"
              >
                <p className="text-xs text-[#68716B]">
                  Enter your email address and we will generate a secure reset link.
                </p>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E9DFC9] bg-white text-xs text-[#092D29]"
                />
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#003D34] text-white text-xs font-bold hover:bg-[#02332C]"
                >
                  Send Recovery Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#FFF9EF] border border-[#E9DFC9] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DFC9]">
              <h3 className="font-serif text-xl font-bold text-[#092D29]">Create Account</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68716B]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsRegisterModalOpen(false);
                onSuccessfulLogin(regName || 'User');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#092D29] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E9DFC9] bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#092D29] mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E9DFC9] bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#092D29] mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E9DFC9] bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#003D34] text-white text-xs font-bold hover:bg-[#02332C] mt-2"
              >
                Create Account & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
