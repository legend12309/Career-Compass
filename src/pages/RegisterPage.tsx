import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { en } from '../i18n/en';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { Compass, UserPlus, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, 'user');
      sounds.playCorrectSound();
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bento-outer-backdrop text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 mb-4 group hover:scale-105 transition-transform"
          onClick={() => sounds.playPopSound()}
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md border-b-4 border-emerald-700">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {en.appName}
          </span>
        </Link>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 duo-card p-6 sm:p-8 space-y-5 shadow-lg">
          {/* Duolingo Mascot Greeting */}
          <div className="flex items-center gap-3.5 pb-2 border-b-2 border-slate-100 dark:border-slate-800">
            <CompyMascot mood="happy" size="md" />
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Join our learning community and level up your career!
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Your Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="reg-pass" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Create Password (min. 6 chars) *
              </label>
              <input
                id="reg-pass"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Confirm Password *
              </label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full duo-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 duo-btn-green text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'START LEARNING (+50 XP)'}</span>
            </button>
          </form>

          {/* Privacy Footnote */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Private · Stored in Your Browser</span>
          </div>

          {/* Sign In Link */}
          <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-sky-600 dark:text-sky-400 hover:underline font-black inline-flex items-center gap-1"
                onClick={() => sounds.playPopSound()}
              >
                <span>SIGN IN</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
