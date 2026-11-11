import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { en } from '../i18n/en';
import { Navbar } from '../components/layout/Navbar';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import {
  Sparkles,
  FileText,
  MessageSquareCode,
  CheckCircle2,
  ArrowRight,
  Flame,
  Zap,
  Trophy,
  Star,
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      title: 'Bite-Sized Career Trails',
      description:
        'Level up along an interactive stepping-stone path with units, milestones, and hands-on projects.',
      icon: Sparkles,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'ATS Single-Column Resume Studio',
      description:
        'Build bulletproof resumes for fresher, experienced, or academic tracks with instant AI scoring and PDF export.',
      icon: FileText,
      color: 'bg-sky-100 text-sky-600',
    },
    {
      title: 'Interactive Mock Interview Coach',
      description:
        'Practice role-specific technical & behavioral viva questions with Compy giving constructive evaluations.',
      icon: MessageSquareCode,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Daily Streak & Opportunity Quests',
      description:
        'Maintain your streak, earn XP, and track jobs, exams, scholarships, and fellowships without losing momentum.',
      icon: Flame,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar showSidebarToggle={false} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-16">
        {/* Hero Section: Duolingo Style with Mascot */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-10 max-w-5xl mx-auto">
          {/* Left: Mascot & Friendly Badge */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs shadow-2xs">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>THE FREE & FUN WAY TO BUILD YOUR CAREER</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Master your career. <br />
              <span className="text-emerald-500">One milestone at a time.</span>
            </h1>

            <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Explore best-fit roles across all fields, practice AI mock interviews, craft ATS resumes, and build your daily career habit.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => sounds.playPopSound()}
                  className="w-full sm:w-auto duo-btn-green px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Go to My Trail</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => sounds.playPopSound()}
                    className="w-full sm:w-auto duo-btn-green px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => sounds.playPopSound()}
                    className="w-full sm:w-auto duo-btn-white px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center"
                  >
                    I Already Have an Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: Large Mascot Illustration Card */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="duo-card bg-amber-50 dark:bg-slate-900 p-8 flex flex-col items-center justify-center shadow-lg border-b-amber-300 dark:border-b-slate-950 max-w-sm">
              <CompyMascot mood="celebrating" size="lg" />
              <div className="mt-4 text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Meet Compy!
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Your AI Career Companion cheering you on every step of your journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid (Duolingo 3D Cards) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Learn With Career Compass?
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Gamified habits combined with production-grade AI tools across healthcare, design, commerce, software, and trades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="duo-card bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 hover:scale-[1.02] transition-transform"
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {feat.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Free Forever</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Audience / Inclusivity Row */}
        <section className="duo-card bg-emerald-50 dark:bg-slate-900 p-8 text-center space-y-4 border-b-emerald-300 dark:border-b-slate-950">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Designed for Everyone Across Every Field
          </h3>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            School students, college graduates, job seekers, career switchers, working professionals, and people returning after a break. Plain English at grade-8 level. No bias, no jargon.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              'School (Class 9-12)',
              'Undergraduate',
              'Postgraduate',
              'Diploma & Vocational',
              'Career Switchers',
              'Returning After a Break',
              'Self-Taught',
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 text-xs font-extrabold shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
