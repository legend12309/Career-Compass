import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveProfile, awardXp } from '../services/db';
import { UserStage } from '../types';
import { en } from '../i18n/en';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import { Compass, ArrowRight, ArrowLeft, AlertCircle, Plus, X, Sparkles } from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentStatus, setCurrentStatus] = useState<UserStage>('undergraduate');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');

  const [educationLevel, setEducationLevel] = useState<string>(en.educationLevels[3]);
  const [fieldOfStudy, setFieldOfStudy] = useState('Full-Stack Web Development & Software');
  const [experienceYears, setExperienceYears] = useState(0);

  const [interests, setInterests] = useState<string[]>(['Full-Stack Development']);
  const [customInterest, setCustomInterest] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [bio, setBio] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const match = en.countries.find((c) => c.country === selectedCountry);
    if (match) setCurrency(match.currency);
  };

  const addInterest = (item: string) => {
    const clean = item.trim();
    if (!clean || interests.includes(clean)) return;
    setInterests([...interests, clean]);
    setCustomInterest('');
  };

  const handleSkip = async () => {
    sounds.playPopSound();
    setSaving(true);
    try {
      await completeOnboarding();
      navigate('/dashboard', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setError(null);

    if (interests.length === 0) {
      setError('Please select or type at least one interest.');
      return;
    }
    if (!careerGoal.trim()) {
      setError('Please enter a career goal or target role.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        currentStatus,
        educationLevel: educationLevel.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        experienceYears: Number(experienceYears) || 0,
        interests,
        careerGoal: careerGoal.trim(),
        country,
        currency,
        bio: bio.trim(),
      });
      await completeOnboarding();
      await awardXp(50, 'Completed Onboarding');
      sounds.playFanfare();
      fireConfetti();
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bento-outer-backdrop text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Duolingo Progress Stepper */}
        <div className="flex items-center gap-3">
          <CompyMascot mood={step === 3 ? 'celebrating' : 'happy'} size="sm" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              <span>Step {step} of 3</span>
              <span>{step === 1 ? 'Current Stage' : step === 2 ? 'Education & Domain' : 'Goals & Strengths'}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Form Container Card */}
        <div className="bg-white dark:bg-slate-900 duo-card p-6 sm:p-8 space-y-6 shadow-md">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Stage & Country */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Where are you in your career journey?
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  We'll customize your recommendations to match your stage.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {en.stages.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      sounds.playPopSound();
                      setCurrentStatus(st);
                    }}
                    className={`p-3.5 rounded-2xl text-xs font-black text-left transition-all cursor-pointer ${
                      currentStatus === st
                        ? 'duo-btn-green text-white'
                        : 'duo-btn-white text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Country & Currency
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full duo-input text-xs"
                >
                  {en.countries.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPopSound();
                    setStep(2);
                  }}
                  className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Education & Field */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  What is your background or domain?
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Works universally across healthcare, engineering, law, commerce, arts, and trades.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Highest Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full duo-input text-xs"
                >
                  {en.educationLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Field of Study or Industry *
                </label>
                <input
                  type="text"
                  required
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g. Mechanical Engineering, Nursing, Commerce, Design, Law"
                  className="w-full duo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full duo-input text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPopSound();
                    setStep(1);
                  }}
                  className="px-4 py-2 duo-btn-white text-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPopSound();
                    setStep(3);
                  }}
                  className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Interests */}
          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  What are your interests & target role?
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  We'll build your personalized learning trail around this.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Career Goal / Dream Role *
                </label>
                <input
                  type="text"
                  required
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Full-Stack Developer, Clinical Specialist, Chartered Accountant"
                  className="w-full duo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Interests & Strengths (Select or Add) *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {interests.map((it) => (
                    <span
                      key={it}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 text-xs font-bold"
                    >
                      <span>{it}</span>
                      <button
                        type="button"
                        onClick={() => setInterests(interests.filter((i) => i !== it))}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add an interest (e.g. AI, Public Speaking)..."
                    className="flex-1 duo-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addInterest(customInterest)}
                    className="px-4 py-2 duo-btn-sky text-xs flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPopSound();
                    setStep(2);
                  }}
                  className="px-4 py-2 duo-btn-white text-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{saving ? 'LAUNCHING...' : 'FINISH & CLAIM +50 XP'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
