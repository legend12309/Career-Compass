import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GamificationState } from '../../types';
import { getGamificationState, toggleQuest } from '../../services/db';
import {
  Menu,
  Search,
  User as UserIcon,
  Shield,
  Flame,
  Zap,
  Gem,
  Target,
  CheckCircle2,
  Circle,
  X,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function Navbar({ onToggleSidebar, showSidebarToggle = true }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState('');
  const [game, setGame] = useState<GamificationState | null>(null);
  const [showQuestHud, setShowQuestHud] = useState(false);
  const [soundActive, setSoundActive] = useState(() => sounds.isEnabled());

  useEffect(() => {
    async function loadGame() {
      if (!user) return;
      try {
        const state = await getGamificationState();
        setGame(state);
      } catch (err) {
        console.error('Error loading gamification state:', err);
      }
    }
    loadGame();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = navSearch.trim().toLowerCase();
    if (!q) return;

    if (q.includes('resum')) navigate('/resume');
    else if (q.includes('interv')) navigate('/interview');
    else if (q.includes('road') || q.includes('plan') || q.includes('learn')) navigate('/roadmap');
    else if (q.includes('idea') || q.includes('career') || q.includes('match')) navigate('/career-ideas');
    else if (q.includes('skill') || q.includes('cert')) navigate('/skills');
    else if (q.includes('opp') || q.includes('job') || q.includes('track') || q.includes('intern')) navigate('/opportunities');
    else if (q.includes('resour') || q.includes('guide') || q.includes('book')) navigate('/resources');
    else if (q.includes('prof') || q.includes('set') || q.includes('priv')) navigate('/profile');
    else if (q.includes('admin') && user?.role === 'admin') navigate('/admin');
    else navigate('/dashboard');

    setNavSearch('');
  };

  const handleQuestToggle = async (id: string) => {
    try {
      const updated = await toggleQuest(id);
      setGame(updated);
    } catch (err) {
      console.error('Error toggling quest:', err);
    }
  };

  const completedQuestsCount = game?.quests.filter((q) => q.completed).length || 2;
  const totalQuests = game?.quests.length || 4;
  const xpCurrent = game?.xp || 420;
  const xpInCurrentLevel = xpCurrent % 100;

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Sidebar Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Career Compass</span>
          <span>/</span>
          <span className="capitalize">{user?.role === 'admin' ? 'Administration' : 'Platform'}</span>
        </div>
      </div>

      {/* Center/Right: Gamified Duolingo-style HUD Bar */}
      {user && (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Flame Pill */}
          <button
            type="button"
            onClick={() => setShowQuestHud((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-extrabold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Daily Career Streak"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{game?.streakDays || 5}</span>
          </button>

          {/* XP Lightning Pill */}
          <button
            type="button"
            onClick={() => setShowQuestHud((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-extrabold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Career Experience Points"
          >
            <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            <span>{game?.xp || 420} XP</span>
          </button>

          {/* Gems Pill */}
          <button
            type="button"
            onClick={() => setShowQuestHud((prev) => !prev)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 font-extrabold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Career Gem Credits"
          >
            <Gem className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
            <span>{game?.gems || 180}</span>
          </button>

          {/* Daily Quests Trigger Button */}
          <button
            type="button"
            onClick={() => setShowQuestHud((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-extrabold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Daily Career Quests"
          >
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Quests</span>
            <span>{completedQuestsCount}/{totalQuests}</span>
          </button>

          {/* Duolingo Audio FX Mute/Unmute Button */}
          <button
            type="button"
            onClick={() => setSoundActive(sounds.toggleSound())}
            className={`p-2 rounded-2xl border text-xs font-bold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              soundActive
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title={soundActive ? 'Sound Effects Enabled (Click to mute)' : 'Sound Muted (Click to enable)'}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Right: Search & User Menu */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Quick search (careers, skills, roadmap)..."
            className="w-56 pl-9 pr-3 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
          />
        </form>

        {/* User Badge / Link */}
        {user ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold flex items-center justify-center text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                {user.role === 'admin' ? (
                  <>
                    <Shield className="w-2.5 h-2.5 text-amber-500" />
                    Admin
                  </>
                ) : (
                  `Lv. ${game?.level || 4} Pathfinder`
                )}
              </span>
            </div>
          </Link>
        ) : (
          <Link
            to="/login"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <UserIcon className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Floating Duolingo-style Quest & XP HUD Popover Modal */}
      {showQuestHud && (
        <div className="absolute right-4 sm:right-16 top-18 w-80 sm:w-96 bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-950 rounded-3xl p-5 shadow-xl z-50 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {game?.streakDays || 5}-Day Career Streak!
                </h3>
                <p className="text-[10px] text-slate-500">
                  You're building momentum daily.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuestHud(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Level Progress Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                Level {game?.level || 4} · {game?.levelTitle || 'Career Pathfinder'}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-extrabold">
                {xpInCurrentLevel}/100 XP
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${xpInCurrentLevel}%` }}
              />
            </div>
          </div>

          {/* Daily Quests List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Today's Quests ({completedQuestsCount}/{totalQuests})
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                +{game?.quests.reduce((acc, q) => acc + (q.completed ? q.xpReward : 0), 0)} XP Earned
              </span>
            </div>

            <div className="space-y-2">
              {(game?.quests || []).map((quest) => (
                <div
                  key={quest.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    quest.completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-900 dark:text-emerald-100'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleQuestToggle(quest.id)}
                    className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
                  >
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-xs font-bold truncate ${quest.completed ? 'line-through text-slate-400 dark:text-emerald-300/60' : ''}`}>
                      {quest.title}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      +{quest.xpReward} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestHud(false);
                        navigate(quest.link);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title="Go to Quest"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}