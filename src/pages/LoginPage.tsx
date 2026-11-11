import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSeedCredentials } from '../services/auth';
import { en } from '../i18n/en';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { Compass, LogIn, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seedUsers = getSeedCredentials();

  const redirectAfterLogin = (role: string, onboarded: boolean) => {
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (!onboarded) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      sounds.playCorrectSound();
      redirectAfterLogin(loggedUser.role, loggedUser.onboarded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    sounds.playPopSound();
    setError(null);
    setIsSubmitting(true);
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      const loggedUser = await login(demoEmail, demoPass);
      sounds.playCorrectSound();
      redirectAfterLogin(loggedUser.role, loggedUser.onboarded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header with Compy Mascot */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <CompyMascot mood="waving" size="sm" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {en.appName}
          </span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Sign in to your account
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Continue your streak, practice mock interviews & build your ATS resume.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="duo-card bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-lg border-b-slate-300 dark:border-b-slate-950">
          {/* Quick Demo Access Row */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              1-Click Instant Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              {seedUsers.map((seed) => {
                const isDemAdmin = seed.role === 'admin';
                return (
                  <button
                    key={seed.email}
                    type="button"
                    onClick={() => handleQuickLogin(seed.email, seed.password)}
                    disabled={isSubmitting}
                    className="duo-btn-white p-2.5 text-left flex flex-col justify-between h-20 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      {isDemAdmin ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span className="text-[9px] font-black uppercase text-slate-400">
                        {seed.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-black block truncate">{seed.label}</span>
                      <span className="text-[10px] font-semibold text-slate-400 block truncate">Pass: {seed.password}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form with Duolingo-style 3D Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="duo-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="duo-input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn-green w-full py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-sky-600 dark:text-sky-400 font-black hover:underline">
                Create one now
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
