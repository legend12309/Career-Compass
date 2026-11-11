import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, listSkills, getCareerResult, saveCareerResult, awardXp } from '../services/db';
import { getCareerIdeas } from '../services/ai';
import { CareerIdeaItem } from '../types/ai';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import {
  Sparkles,
  AlertCircle,
  RotateCcw,
  Milestone,
  CheckCircle2,
  ArrowUpRight,
  Star,
  Layers,
  TrendingUp,
  Zap,
} from 'lucide-react';

export function RecommendationsPage() {
  const navigate = useNavigate();

  const [educationLevel, setEducationLevel] = useState('Undergraduate Degree');
  const [fieldOfStudy, setFieldOfStudy] = useState('Full-Stack Web Development & Software');
  const [currentStatus, setCurrentStatus] = useState('undergraduate');
  const [experienceYears, setExperienceYears] = useState(0);
  const [interestsInput, setInterestsInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [preferredWorkStyle, setPreferredWorkStyle] = useState('Hybrid or Remote Collaborative Team');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');

  const [careers, setCareers] = useState<CareerIdeaItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  useEffect(() => {
    async function load() {
      try {
        const [profile, skills, cached] = await Promise.all([
          getProfile(),
          listSkills(),
          getCareerResult(),
        ]);
        if (profile) {
          setEducationLevel(profile.educationLevel);
          setFieldOfStudy(profile.fieldOfStudy);
          setCurrentStatus(profile.currentStatus);
          setExperienceYears(profile.experienceYears);
          setInterestsInput((profile.interests || []).join(', '));
          setCountry(profile.country || 'India');
          setCurrency(profile.currency || 'INR');
          if (profile.preferredWorkStyle) setPreferredWorkStyle(profile.preferredWorkStyle);
        }
        if (skills.length > 0) {
          setSkillsInput(skills.map((s) => s.name).join(', '));
        }
        if (cached?.data?.careers) {
          setCareers(cached.data.careers);
          setLastUpdated(cached.createdAt);
        }
      } catch (err) {
        console.error('Error loading career ideas:', err);
      }
    }
    load();
  }, []);

  const handleGenerate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (generating) return;

    sounds.playPopSound();
    const interests = interestsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!fieldOfStudy.trim() || (interests.length === 0 && skills.length === 0)) {
      setError('Please enter your field of study and at least one interest or skill.');
      return;
    }

    setError(null);
    setGenerating(true);
    try {
      const output = await getCareerIdeas({
        educationLevel,
        fieldOfStudy,
        currentStatus,
        experienceYears,
        interests,
        skills,
        preferredWorkStyle,
        country,
        currency,
      });
      setCareers(output.careers);
      const saved = await saveCareerResult(output);
      setLastUpdated(saved.createdAt);

      await awardXp(25, 'Generated Career Recommendations');
      sounds.playCorrectSound();
      fireConfetti();
      setXpToast({ show: true, text: '+25 XP! New Career Pathways Unlocked 🎯' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load career ideas.');
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryCardStyle = (category: string) => {
    switch (category) {
      case 'best-fit':
        return {
          border: 'border-2 border-emerald-300 dark:border-emerald-800 border-b-4 border-b-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
          tag: 'BEST FIT',
        };
      case 'adjacent':
        return {
          border: 'border-2 border-amber-300 dark:border-amber-800 border-b-4 border-b-amber-500',
          badge: 'bg-amber-100 text-amber-800 border-2 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
          tag: 'ADJACENT PATH',
        };
      case 'stretch':
      default:
        return {
          border: 'border-2 border-indigo-300 dark:border-indigo-800 border-b-4 border-b-indigo-500',
          badge: 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700',
          tag: 'STRETCH GOAL',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Gamified Floating XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Compy Mascot Speech Banner */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center gap-4 shadow-sm">
        <CompyMascot mood="happy" size="md" />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Compy AI Counselor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Tailored Career Pathways
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Discover roles matched to your unique skills. Every pathway can be converted into a step-by-step roadmap!
          </p>
        </div>
        {lastUpdated && (
          <span className="hidden sm:inline-block text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 self-center">
            Updated {new Date(lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Input Parameters Form (Tactile 3D Duolingo Card) */}
      <form
        onSubmit={handleGenerate}
        className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label htmlFor="ci-field" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Field of Study or Work *
            </label>
            <input
              id="ci-field"
              type="text"
              required
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="ci-edu" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Education Level *
            </label>
            <input
              id="ci-edu"
              type="text"
              required
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="ci-interests" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Interests (comma-separated) *
            </label>
            <input
              id="ci-interests"
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="ci-skills" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Key Skills (comma-separated) *
            </label>
            <input
              id="ci-skills"
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">
            Region: <strong className="text-slate-700 dark:text-slate-300">{country}</strong> ({currency})
          </span>
          <button
            type="submit"
            disabled={generating}
            className="px-6 py-2.5 duo-btn-green text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'ANALYZING WITH GEMINI...' : 'DISCOVER CAREER PATHS (+25 XP)'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200 font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate()}
            className="px-3 py-1.5 duo-btn-white text-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 inline mr-1" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Grid of Duolingo Tactile Recommendation Cards */}
      {!generating && careers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {careers.map((item, idx) => {
            const style = getCategoryCardStyle(item.category);

            return (
              <div
                key={`${item.title}-${idx}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all ${style.border}`}
              >
                <div className="space-y-3">
                  {/* Category badge + Match % pill with gold star */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
                      <Layers className="w-3 h-3" />
                      {style.tag}
                    </span>

                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-800 text-[11px] font-black text-amber-900 dark:text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{item.matchPercent}% MATCH</span>
                    </div>
                  </div>

                  {/* Career Title & Salary */}
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{item.approxSalaryRange}</span> · <span>{item.growthOutlook}</span>
                    </p>
                  </div>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.whyItFits}
                  </p>

                  {/* Required Skills */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Core Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.requiredSkills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {item.missingSkills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                        Skills to Level Up
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.missingSkills.slice(0, 3).map((ms) => (
                          <span
                            key={ms}
                            className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold"
                          >
                            + {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPopSound();
                      navigate(`/roadmap?role=${encodeURIComponent(item.title)}`);
                    }}
                    className="w-full py-2.5 duo-btn-green text-xs flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <Milestone className="w-3.5 h-3.5" />
                    <span>START LEARNING TRAIL 🚀</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
