import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, listSkills, getRoadmap, saveRoadmap, awardXp } from '../services/db';
import { generateRoadmap } from '../services/ai';
import { RoadmapPlan } from '../types';
import { DuolingoLessonModal } from '../components/roadmap/DuolingoLessonModal';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  BookOpen,
  Lightbulb,
  Clock,
  Layers,
  Crown,
  Zap,
  Lock,
  Star,
  Flame,
  Check,
} from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [weeksAvailable, setWeeksAvailable] = useState(12);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [budget, setBudget] = useState<'free' | 'low' | 'flexible'>('free');
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'trail' (Duolingo stepping stone map) or 'checklist'
  const [viewMode, setViewMode] = useState<'trail' | 'checklist'>('trail');

  // Active Duolingo interactive lesson modal
  const [activeLesson, setActiveLesson] = useState<{
    topicKey: string;
    topicTitle: string;
    phaseTitle: string;
  } | null>(null);

  // Gamified celebratory toast
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      const [prof, skills, existingRoadmap] = await Promise.all([
        getProfile(),
        listSkills(),
        getRoadmap(),
      ]);
      if (!active) return;

      setSkillNames(skills.map((s) => s.name));
      if (existingRoadmap) {
        setRoadmap(existingRoadmap);
        setTargetRole(existingRoadmap.targetRole);
      } else if (prof?.careerGoal) {
        setTargetRole(prof.careerGoal);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Please enter a target career or goal.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const output = await generateRoadmap({
        targetRole: targetRole.trim(),
        currentSkills: skillNames,
        weeksAvailable: Math.min(52, Math.max(2, Number(weeksAvailable) || 12)),
        hoursPerWeek: Math.min(60, Math.max(2, Number(hoursPerWeek) || 10)),
        budget,
      });

      const saved = await saveRoadmap({
        id: roadmap?.id || `rm-${Date.now()}`,
        targetRole: targetRole.trim(),
        data: output,
        progress: [],
        createdAt: new Date().toISOString(),
      });
      setRoadmap(saved);
      setXpToast({ show: true, text: 'New Curriculum Unlocked! +100 XP 🎯' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not generate roadmap. Please click Retry.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTopicKey = async (key: string) => {
    if (!roadmap) return;
    const exists = roadmap.progress.includes(key);
    const nextProgress = exists
      ? roadmap.progress.filter((k) => k !== key)
      : [...roadmap.progress, key];

    const saved = await saveRoadmap({
      ...roadmap,
      progress: nextProgress,
    });
    setRoadmap(saved);

    if (!exists) {
      await awardXp(50, 'Roadmap Milestone Completed');
      setXpToast({ show: true, text: '+50 XP! Milestone Completed! ⭐' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2200);
    }
  };

  const totalTopics = roadmap
    ? roadmap.data.phases.reduce((acc, p) => acc + p.topics.length, 0)
    : 0;
  const completedCount = roadmap ? roadmap.progress.length : 0;
  const progressPercent =
    totalTopics > 0 ? Math.min(100, Math.round((completedCount / totalTopics) * 100)) : 0;

  return (
    <div className="space-y-6 relative">
      {/* Floating Gamified XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-extrabold text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Learning Roadmap & Trail
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] border border-amber-300 dark:border-amber-800">
              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
              +50 XP PER MILESTONE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build a step-by-step weekly milestone plan tailored to your available time and budget.
          </p>
        </div>

        {/* Duolingo-style View Toggle */}
        {roadmap && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('trail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'trail'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🛤️ Adventure Trail
            </button>
            <button
              type="button"
              onClick={() => setViewMode('checklist')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'checklist'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              📋 Checklist View
            </button>
          </div>
        )}
      </div>

      {/* Generator Form with Tactile 3D Styling */}
      <form
        onSubmit={handleGenerate}
        className="duo-card bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Role, Exam, or Career Track *
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Full-Stack Developer, Clinical Nurse, Financial Analyst"
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Weeks Available
            </label>
            <input
              type="number"
              min={2}
              max={52}
              value={weeksAvailable}
              onChange={(e) => setWeeksAvailable(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hours / Week
            </label>
            <input
              type="number"
              min={2}
              max={60}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Budget Preference
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as 'free' | 'low' | 'flexible')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
            >
              <option value="free">100% Free Resources</option>
              <option value="low">Low-Cost Books & MOOCs</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="duo-btn-green px-6 py-2.5 text-xs font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Stepping Stones...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{roadmap ? 'Regenerate Learning Trail' : 'Build Learning Trail'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-3.5 py-1.5 rounded-xl bg-rose-700 text-white font-bold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {roadmap && (
        <div className="space-y-6">
          {/* Progress Banner with Duolingo Tactile 3D Styling */}
          <div className="duo-card bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Active Trail: {roadmap.targetRole}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {completedCount} of {totalTopics} Milestones Mastered
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Earn +50 XP per completed topic to level up your profile
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {progressPercent}%
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Mastery
                </span>
              </div>
            </div>

            {/* Duolingo Tactile Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* VIEW MODE 1: DUOLINGO STEPPING STONE TRAIL */}
          {viewMode === 'trail' && (
            <div className="space-y-8 max-w-2xl mx-auto py-4">
              {roadmap.data.phases.map((phase, pIdx) => {
                return (
                  <div key={pIdx} className="space-y-5">
                    {/* Phase Unit Header Banner */}
                    <div className="duo-card bg-emerald-500 text-white p-4 sm:p-5 flex items-center justify-between shadow-md border-b-emerald-700">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                          Unit {pIdx + 1} · {phase.weeks}
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                          {phase.title}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-600/60 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
                      </div>
                    </div>

                    {/* Stepping Stones Path */}
                    <div className="flex flex-col items-center space-y-6 py-2">
                      {phase.topics.map((topic, tIdx) => {
                        const key = `${pIdx}::${topic}`;
                        const isDone = roadmap.progress.includes(key);

                        // Position offset for winding path feel
                        const offsets = ['translate-x-0', '-translate-x-6', 'translate-x-6', 'translate-x-0'];
                        const offsetClass = offsets[tIdx % offsets.length];

                        return (
                          <div
                            key={tIdx}
                            className={`flex flex-col items-center ${offsetClass} transition-transform`}
                          >
                            {/* Stepping Stone Node Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isDone) {
                                  setActiveLesson({
                                    topicKey: key,
                                    topicTitle: topic,
                                    phaseTitle: phase.title,
                                  });
                                } else {
                                  toggleTopicKey(key);
                                }
                              }}
                              className={`duo-node ${
                                isDone
                                  ? 'bg-emerald-500 text-white border-b-emerald-700 hover:bg-emerald-400'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 border-b-slate-400 dark:border-b-slate-900 hover:border-indigo-400'
                              }`}
                              title={isDone ? 'Mark as incomplete' : 'Launch interactive lesson (+50 XP)'}
                            >
                              {isDone ? (
                                <Star className="w-6 h-6 fill-amber-300 text-amber-300" />
                              ) : (
                                <span className="text-sm font-extrabold">{tIdx + 1}</span>
                              )}
                            </button>

                            {/* Topic Title Label */}
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 max-w-xs text-center px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {topic}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hands-On Project Card at the end of Unit */}
                    <div className="duo-card bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 p-4 space-y-1.5 border-b-amber-300 dark:border-b-amber-950">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-400">
                        <Lightbulb className="w-4 h-4" />
                        <span>Unit {pIdx + 1} Project Challenge</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {phase.practiceIdea}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: STRUCTURED CHECKLIST VIEW */}
          {viewMode === 'checklist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roadmap.data.phases.map((phase, pIdx) => {
                return (
                  <div
                    key={pIdx}
                    className="duo-card bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {phase.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Clock className="w-3 h-3" />
                          {phase.weeks}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {phase.topics.map((topic, tIdx) => {
                          const key = `${pIdx}::${topic}`;
                          const checked = roadmap.progress.includes(key);

                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => toggleTopicKey(key)}
                              className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                checked
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100'
                                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              {checked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`text-xs font-bold ${
                                  checked
                                    ? 'line-through text-slate-400 font-normal'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {topic}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Hands-On Project / Case Study</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {phase.practiceIdea}
                        </p>
                      </div>

                      {phase.freeResources.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Curated Resources
                          </span>
                          <ul className="space-y-1">
                            {phase.freeResources.map((res, rIdx) => (
                              <li key={rIdx} className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                <span className="truncate mr-2">• {res.name}</span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                                  {res.type}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Duolingo Interactive Lesson Modal */}
          {activeLesson && (
            <DuolingoLessonModal
              topicTitle={activeLesson.topicTitle}
              phaseTitle={activeLesson.phaseTitle}
              onClose={() => setActiveLesson(null)}
              onComplete={() => {
                toggleTopicKey(activeLesson.topicKey);
                setActiveLesson(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};