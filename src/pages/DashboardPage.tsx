import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Profile, Skill, Opportunity, Resume, RoadmapPlan, GamificationState } from '../types';
import {
  getProfile,
  listSkills,
  listOpportunities,
  getResume,
  getRoadmap,
  getGamificationState,
  toggleQuest,
  awardXp,
} from '../services/db';
import {
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Settings,
  BookOpen,
  Scale,
  Sparkles,
  FileText,
  Briefcase,
  Award,
  Milestone,
  MessageSquareCode,
  Flame,
  Zap,
  Gem,
  Target,
  CheckCircle2,
  Circle,
  Trophy,
} from 'lucide-react';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPlan | null>(null);
  const [game, setGame] = useState<GamificationState | null>(null);
  const [, setLoading] = useState(true);

  // Gamification celebratory floating toast
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [prof, sk, opps, res, rm, gameState] = await Promise.all([
          getProfile(),
          listSkills(),
          listOpportunities(),
          getResume(),
          getRoadmap(),
          getGamificationState(),
        ]);
        setProfile(prof);
        setSkills(sk);
        setOpportunities(opps);
        setResume(res);
        setRoadmap(rm);
        setGame(gameState);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Handle Quest Toggle
  const handleToggleQuest = async (questId: string) => {
    try {
      const updated = await toggleQuest(questId);
      setGame(updated);
      sounds.playCorrectSound();
      fireConfetti();
      setXpToast({ show: true, text: '+50 XP! Quest Completed 🎉' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2200);
    } catch (err) {
      console.error('Quest error:', err);
    }
  };

  // Compute roadmap metrics
  const computeRoadmapTopics = (): { total: number; done: number; percent: number } => {
    if (!roadmap?.data?.phases) return { total: 24, done: 11, percent: 46 };
    let total = 0;
    roadmap.data.phases.forEach((ph) => {
      total += ph.topics.length;
    });
    if (total === 0) return { total: 24, done: 11, percent: 46 };
    const done = roadmap.progress.length;
    return {
      total,
      done,
      percent: Math.min(100, Math.round((done / total) * 100)),
    };
  };

  const roadmapStats = computeRoadmapTopics();
  const resumeScore = resume?.lastScore || 72;
  const activeCount = opportunities.length > 0 ? opportunities.length : 14;

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const calendarCells = [];
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, currentMonth: true });
  }
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({ day: d, currentMonth: false });
  }

  const todayDate = new Date().getDate();

  // Search indexing
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const modules = [
      { title: 'AI Career Ideas', desc: 'Find matched career paths and salary data', path: '/career-ideas', icon: Sparkles },
      { title: 'ATS Resume Studio', desc: 'Build ATS-ready resume and download PDF', path: '/resume', icon: FileText },
      { title: 'Mock Interview Practice', desc: 'Simulate role-specific technical & viva questions', path: '/interview', icon: MessageSquareCode },
      { title: 'Learning Roadmap', desc: 'Step-by-step milestone curriculum & quizzes', path: '/roadmap', icon: Milestone },
      { title: 'Opportunity Tracker', desc: 'Track jobs, internships, exams & scholarships', path: '/opportunities', icon: Briefcase },
      { title: 'Skills & Certificates', desc: 'Manage proficiency and verify credentials', path: '/skills', icon: Award },
      { title: 'Resources Library', desc: 'Curated free courses, books & platforms', path: '/resources', icon: BookOpen },
      { title: 'Profile & Privacy', desc: 'Settings, data export & deletion', path: '/profile', icon: Settings },
    ];

    const matchedModules = modules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    );

    const matchedOpps = opportunities
      .filter((o) => o.title.toLowerCase().includes(q) || o.organization.toLowerCase().includes(q))
      .map((o) => ({
        title: `${o.title} (${o.organization})`,
        desc: `Opportunity · Status: ${o.status}`,
        path: '/opportunities',
        icon: Briefcase,
      }));

    return [...matchedModules, ...matchedOpps].slice(0, 5);
  }, [searchQuery, opportunities]);

  const completedQuestsCount = game?.quests.filter((q) => q.completed).length || 2;
  const totalQuests = game?.quests.length || 4;
  const xpCurrent = game?.xp || 420;
  const xpInCurrentLevel = xpCurrent % 100;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn relative">
      {/* Floating Gamified XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Main White Canvas matching the exact reference UI */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 lg:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
        {/* Top Header: "Welcome back 👋" + Search Pill + Profile Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <CompyMascot mood="happy" size="md" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Welcome back</span>
                <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Focus: <strong className="text-slate-700 dark:text-slate-300 font-bold">{profile?.fieldOfStudy || 'IT & Software'}</strong> · Goal: <strong className="text-slate-700 dark:text-slate-300 font-bold">{profile?.careerGoal || 'UX/UI Design'}</strong>
              </p>
            </div>
          </div>

          {/* Right Header: Search Pill + Avatar */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="relative">
              <div className="flex items-center bg-[#F8FAFC] dark:bg-slate-800 rounded-full border border-slate-200/80 dark:border-slate-700 px-4 py-2 w-56 sm:w-64 focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-colors">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search something"
                  className="w-full text-xs bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Instant Search Dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-950 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                    Quick Navigation
                  </span>
                  {searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link
              to="/profile"
              onClick={() => sounds.playPopSound()}
              className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs shadow-xs hover:scale-105 transition-transform"
              title="Profile & Settings"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Link>
          </div>
        </div>

        {/* Perfectly Balanced 2-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN (7 COLS): Activities Today + Learning Progress               */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-7">
            {/* 1. Your activities today (8) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Your activites today
                </h2>
                <span className="text-slate-400 font-normal text-sm">
                  (8)
                </span>
              </div>

              {/* 2 Activity Cards Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Pastel Mint (Primary Pathway) */}
                <div className="bg-pastel-mint rounded-3xl p-5 sm:p-6 flex flex-col justify-between h-48 relative shadow-2xs hover:shadow-xs transition-all">
                  {/* Top row: Avatar pile + Rating pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5">
                      <span className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        A
                      </span>
                      <span className="w-7 h-7 rounded-full bg-rose-400 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        B
                      </span>
                      <span className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        C
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold shadow-2xs ml-1">
                        +8
                      </span>
                    </div>

                    <div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                    </div>
                  </div>

                  {/* Bottom row: Title + Diagonal Arrow Circle Button */}
                  <div className="flex items-end justify-between mt-auto pt-4">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {profile?.careerGoal || 'UX/UI Design'}
                    </h3>
                    <Link
                      to="/roadmap"
                      onClick={() => sounds.playPopSound()}
                      className="bento-circle-btn shrink-0"
                      title="Open Roadmap"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Card 2: Pastel Pink (Adjacent High-Growth Skill) */}
                <div className="bg-pastel-pink rounded-3xl p-5 sm:p-6 flex flex-col justify-between h-48 relative shadow-2xs hover:shadow-xs transition-all">
                  {/* Top row: Avatar pile + Rating pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5">
                      <span className="w-7 h-7 rounded-full bg-sky-400 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        D
                      </span>
                      <span className="w-7 h-7 rounded-full bg-purple-400 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        E
                      </span>
                      <span className="w-7 h-7 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                        F
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold shadow-2xs ml-1">
                        +6
                      </span>
                    </div>

                    <div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>4.4</span>
                    </div>
                  </div>

                  {/* Bottom row: Title + Diagonal Arrow Circle Button */}
                  <div className="flex items-end justify-between mt-auto pt-4">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                      Motion Design
                    </h3>
                    <Link
                      to="/career-ideas"
                      onClick={() => sounds.playPopSound()}
                      className="bento-circle-btn shrink-0"
                      title="Explore Career Ideas"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Learning progress */}
            <div className="space-y-3.5">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Learning progress
              </h2>

              {/* 3 Pastel Metric Cards Side-by-Side */}
              <div className="grid grid-cols-3 gap-3.5">
                {/* Completed */}
                <Link
                  to="/roadmap"
                  onClick={() => sounds.playPopSound()}
                  className="bg-pastel-mint rounded-3xl p-4 flex flex-col justify-between h-28 shadow-2xs hover:scale-[1.02] transition-transform group"
                >
                  <div className="flex items-center justify-between text-slate-800 dark:text-emerald-200">
                    <span className="text-xs font-bold">Completed</span>
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-2xs group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {roadmapStats.done || 18}
                  </span>
                </Link>

                {/* Your score */}
                <Link
                  to="/resume"
                  onClick={() => sounds.playPopSound()}
                  className="bg-pastel-yellow rounded-3xl p-4 flex flex-col justify-between h-28 shadow-2xs hover:scale-[1.02] transition-transform group"
                >
                  <div className="flex items-center justify-between text-slate-800 dark:text-amber-200">
                    <span className="text-xs font-bold">Your score</span>
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-2xs group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {resumeScore || 72}
                  </span>
                </Link>

                {/* Active */}
                <Link
                  to="/opportunities"
                  onClick={() => sounds.playPopSound()}
                  className="bg-pastel-lilac rounded-3xl p-4 flex flex-col justify-between h-28 shadow-2xs hover:scale-[1.02] transition-transform group"
                >
                  <div className="flex items-center justify-between text-slate-800 dark:text-purple-200">
                    <span className="text-xs font-bold">Active</span>
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-2xs group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {activeCount}
                  </span>
                </Link>
              </div>

              {/* Wide Yellow Active Progress Card */}
              <div className="bg-pastel-yellow rounded-3xl p-5 sm:p-6 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-amber-100">
                    <Settings className="w-3.5 h-3.5" />
                    <span>{profile?.fieldOfStudy || 'IT & Software'}</span>
                  </div>
                  <Link
                    to="/roadmap"
                    onClick={() => sounds.playPopSound()}
                    className="bento-circle-btn shrink-0"
                    title="Continue Roadmap"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-amber-200 font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {roadmapStats.done || 11}/{roadmapStats.total || 24} Lessons
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                    {roadmap?.targetRole || profile?.careerGoal || 'Motion Design'}
                  </h3>
                </div>

                {/* Solid Dark Progress Bar */}
                <div className="w-full h-2.5 bg-amber-200/80 dark:bg-amber-950/80 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
                    style={{ width: `${roadmapStats.percent || 45}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (5 COLS): Lesson Schedule Calendar + 2 Course Cards          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-3.5">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Lesson schedule
              </h2>

              {/* Calendar Widget matching reference UI */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                {/* Header: Month & Year with Navigation Arrows */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {monthName} {year}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPopSound();
                        prevMonth();
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPopSound();
                        nextMonth();
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Row */}
                <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 tracking-wider">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>

                {/* Calendar Grid with Highlighted Bubbles */}
                <div className="grid grid-cols-7 text-center gap-y-2 text-xs">
                  {calendarCells.map((cell, idx) => {
                    const isCurrent = cell.currentMonth;
                    const isSelected = isCurrent && cell.day === selectedDay;
                    const isToday = isCurrent && cell.day === todayDate && month === new Date().getMonth() && year === new Date().getFullYear();
                    const hasScheduledItem = isCurrent && (cell.day === todayDate || cell.day === 15 || cell.day === 22);

                    return (
                      <div key={idx} className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPopSound();
                            if (isCurrent) setSelectedDay(cell.day);
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-xs scale-105'
                              : isToday
                                ? 'bg-emerald-500 text-white font-black shadow-xs'
                                : isCurrent
                                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                                  : 'text-slate-300 dark:text-slate-600 font-medium'
                          }`}
                        >
                          {cell.day}
                          {hasScheduledItem && !isSelected && !isToday && (
                            <span className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400 absolute bottom-0.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2 Curated Course / Drill Schedule Cards */}
              <div className="space-y-3">
                <Link
                  to="/roadmap"
                  onClick={() => sounds.playPopSound()}
                  className="bg-pastel-schedule rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs hover:scale-[1.01] transition-transform block border border-slate-100/80 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                        Next Lesson
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        {roadmap?.targetRole || profile?.careerGoal || 'Core Skills'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mt-1">
                      {roadmap?.data?.phases?.[0]?.topics?.[0] || 'Professional Foundations & Industry Standards'}
                    </h4>
                  </div>
                </Link>

                <Link
                  to="/interview"
                  onClick={() => sounds.playPopSound()}
                  className="bg-pastel-schedule rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs hover:scale-[1.01] transition-transform block border border-slate-100/80 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs shrink-0">
                    <MessageSquareCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        Daily Drill
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        Interview Readiness
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mt-1">
                      {profile?.careerGoal ? `${profile.careerGoal} Simulated Questions` : 'Simulate 8 Role-Specific Mock Questions'}
                    </h4>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: Duolingo Daily Career Quests & Streak Mastery Tray        */}
        {/* ========================================================================= */}
        <div className="duo-card bg-[#FAFDFB] dark:bg-slate-900/80 p-6 sm:p-7 space-y-5 border-2 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <CompyMascot
                mood={completedQuestsCount === totalQuests ? 'celebrating' : 'happy'}
                size="sm"
                speechText={completedQuestsCount === totalQuests ? 'Awesome! All quests cleared! 🎉' : undefined}
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Daily Career Quests</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                    {completedQuestsCount}/{totalQuests} Done
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Earn XP, unlock milestone badges, and keep your daily learning streak burning!
                </p>
              </div>
            </div>

            {/* Streak & Level Stats */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700 font-black text-xs shadow-2xs">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{game?.streakDays || 5} DAY STREAK</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 font-black text-xs shadow-2xs">
                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                <span>{game?.xp || 420} XP</span>
              </div>
            </div>
          </div>

          {/* Level Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Level {game?.level || 4}: {game?.levelTitle || 'Career Pathfinder'}
              </span>
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                {xpInCurrentLevel} / 100 XP to Level {(game?.level || 4) + 1}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${xpInCurrentLevel}%` }}
              />
            </div>
          </div>

          {/* 4 Interactive Quests Cards in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {(game?.quests || []).map((quest) => (
              <div
                key={quest.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  quest.completed
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-emerald-100 shadow-2xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleQuest(quest.id)}
                    className="flex items-start gap-2 text-left cursor-pointer flex-1"
                  >
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs font-bold leading-tight ${quest.completed ? 'line-through text-slate-400 dark:text-emerald-300/60' : ''}`}>
                      {quest.title}
                    </span>
                  </button>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">
                    +{quest.xpReward} XP
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPopSound();
                    navigate(quest.link);
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Launch Tool</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
