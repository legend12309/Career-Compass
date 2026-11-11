import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { en } from '../../i18n/en';
import { sounds } from '../../utils/soundEffects';
import { CompyMascot } from '../mascot/CompyMascot';
import {
  LayoutGrid,
  Sparkles,
  FileText,
  Award,
  MessageSquareCode,
  Milestone,
  Briefcase,
  BookOpen,
  Settings,
  ShieldCheck,
  X,
  LogOut,
  Sun,
  Moon,
  Trophy,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutGrid, color: 'text-sky-500 bg-sky-100 dark:bg-sky-950/60' },
    { name: 'Career Ideas', to: '/career-ideas', icon: Sparkles, badge: 'AI', color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/60' },
    { name: 'Resume Studio', to: '/resume', icon: FileText, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/60' },
    { name: 'Skills & Vault', to: '/skills', icon: Award, color: 'text-purple-500 bg-purple-100 dark:bg-purple-950/60' },
    { name: 'Mock Interview', to: '/interview', icon: MessageSquareCode, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/60' },
    { name: 'Roadmap Trail', to: '/roadmap', icon: Milestone, badge: 'TRAIL', color: 'text-rose-500 bg-rose-100 dark:bg-rose-950/60' },
    { name: 'Job Tracker', to: '/opportunities', icon: Briefcase, color: 'text-teal-500 bg-teal-100 dark:bg-teal-950/60' },
    { name: 'Resources', to: '/resources', icon: BookOpen, color: 'text-blue-500 bg-blue-100 dark:bg-blue-950/60' },
    { name: 'Profile & Privacy', to: '/profile', icon: Settings, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Duolingo-style Sidebar Navigation (Sticky on desktop, fixed slide-over on mobile) */}
      <aside
        aria-label="Sidebar Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-30 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Pinned Top: Brand Header with Compy Mascot */}
        <div className="h-20 px-4 border-b-2 border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <NavLink
            to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 group"
            onClick={() => {
              sounds.playPopSound();
              onClose();
            }}
          >
            <CompyMascot mood="happy" size="sm" />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                Career Compass
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase mt-1 block">
                Career Pathfinder
              </span>
            </div>
          </NavLink>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Links (Self-contained scroll area) */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain">
          <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Career Tracks
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    sounds.playPopSound();
                    onClose();
                  }}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-2 border-b-4 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border-2 border-transparent font-extrabold hover:border-slate-200 dark:hover:border-slate-700/60 active:translate-y-0.5'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="tracking-wide text-xs font-black">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Admin Panel Link */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => {
                  sounds.playPopSound();
                  onClose();
                }}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs transition-all mt-2 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-2xs border-2 border-b-4 border-amber-600 font-black'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-2 border-transparent font-extrabold'
                  }`
                }
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                </div>
                <span className="tracking-wide text-xs font-black">Admin Panel</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Pinned Bottom: League, Theme & Utilities */}
        <div className="p-3 border-t-2 border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {/* Duolingo League Pill */}
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-b-4 border-amber-300 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                <Trophy className="w-4 h-4 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 block leading-tight">
                  Gold League #4
                </span>
                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block">
                  Top 5 Advance
                </span>
              </div>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-2xs">
              ACTIVE
            </span>
          </div>

          {/* Theme & Logout Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playPopSound();
                toggleDarkMode();
              }}
              className="flex-1 duo-btn-white py-2 px-3 text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPopSound();
                  logout();
                }}
                className="py-2 px-3 rounded-2xl border-2 border-b-4 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
