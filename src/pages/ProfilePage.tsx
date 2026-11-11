import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserStage, GamificationState } from '../types';
import {
  getProfile,
  saveProfile,
  exportMyDataAsJson,
  deleteMyAccountAndAllData,
  getGamificationState,
} from '../services/db';
import { updateCurrentUserName } from '../services/auth';
import { en } from '../i18n/en';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Download,
  Trash2,
  Shield,
  Trophy,
  Flame,
  Zap,
  Gem,
} from 'lucide-react';

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [currentStatus, setCurrentStatus] = useState<UserStage>('undergraduate');
  const [educationLevel, setEducationLevel] = useState<string>(en.educationLevels[3]);
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');
  const [bio, setBio] = useState('');
  const [game, setGame] = useState<GamificationState | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (user?.name) setName(user.name);
        const [data, gameState] = await Promise.all([getProfile(), getGamificationState()]);
        setGame(gameState);
        if (data) {
          setCurrentStatus(data.currentStatus);
          setEducationLevel(data.educationLevel);
          setFieldOfStudy(data.fieldOfStudy);
          setExperienceYears(data.experienceYears);
          setInterests(data.interests || []);
          setCareerGoal(data.careerGoal);
          setCountry(data.country || 'India');
          setCurrency(data.currency || 'INR');
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id, user?.name]);

  const handleAddInterest = (val: string) => {
    const clean = val.trim();
    if (!clean || interests.includes(clean)) return;
    setInterests([...interests, clean]);
    setCustomInterest('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setStatusMessage(null);
    setSaving(true);
    try {
      if (name.trim() && name.trim() !== user?.name) {
        await updateCurrentUserName(name.trim());
        await refreshUser();
      }
      await saveProfile({
        currentStatus,
        educationLevel: educationLevel.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        experienceYears: Number(experienceYears) || 0,
        interests,
        careerGoal: careerGoal.trim(),
        country: country.trim(),
        currency: currency.trim(),
        bio: bio.trim(),
      });
      sounds.playCorrectSound();
      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    sounds.playPopSound();
    try {
      const json = await exportMyDataAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career-compass-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      sounds.playCorrectSound();
    } catch (err) {
      console.error('Export error:', err);
      setStatusMessage({ type: 'error', text: 'Could not export your data.' });
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await deleteMyAccountAndAllData();
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Delete error:', err);
      setStatusMessage({ type: 'error', text: 'Could not delete your account.' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Compy Mascot Header */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <CompyMascot mood="happy" size="md" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider mb-1">
              <Trophy className="w-3 h-3 text-amber-600" />
              <span>Gold League · #4</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Learner Profile & Privacy
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal background, country settings, and privacy controls.
            </p>
          </div>
        </div>

        <button
          form="profile-form"
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      {/* Gamification Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black border-2 border-amber-300">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Streak Record</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">{game?.streakDays || 5} Days Active</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black border-2 border-emerald-300">
            <Zap className="w-6 h-6 fill-emerald-500 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Experience</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">{game?.xp || 420} Total XP</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-black border-2 border-sky-300">
            <Gem className="w-6 h-6 fill-sky-500 text-sky-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gems Balance</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">{game?.gems || 180} Gems</p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-black shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <form
        id="profile-form"
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-7 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="prof-name" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              id="prof-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="prof-stage" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Current Stage *
            </label>
            <select
              id="prof-stage"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as UserStage)}
              className="w-full duo-input text-xs"
            >
              {en.stages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-exp" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Experience (Years) *
            </label>
            <input
              id="prof-exp"
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full duo-input text-xs tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="prof-edu" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Education Level *
            </label>
            <select
              id="prof-edu"
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
            <label htmlFor="prof-field" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Field of Study or Work *
            </label>
            <input
              id="prof-field"
              type="text"
              required
              maxLength={120}
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Software, Healthcare, Commerce, Law"
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="prof-country" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Country & Currency
            </label>
            <select
              id="prof-country"
              value={country}
              onChange={(e) => {
                const c = e.target.value;
                setCountry(c);
                const match = en.countries.find((item) => item.country === c);
                if (match) setCurrency(match.currency);
              }}
              className="w-full duo-input text-xs"
            >
              {en.countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country} ({c.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Interests & Strengths
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {interests.map((it) => (
              <span
                key={it}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 text-xs font-bold"
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
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add another interest (e.g. Graphic Design)..."
              className="flex-1 duo-input text-xs"
            />
            <button
              type="button"
              onClick={() => handleAddInterest(customInterest)}
              className="px-4 py-2 duo-btn-sky text-xs flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="prof-goal" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Career Goal / Target Role *
          </label>
          <input
            id="prof-goal"
            type="text"
            required
            maxLength={180}
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="e.g. Full-Stack Developer, Clinical Nurse, Chartered Accountant"
            className="w-full duo-input text-xs"
          />
        </div>

        <div>
          <label htmlFor="prof-bio" className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Short Professional Summary / Bio
          </label>
          <textarea
            id="prof-bio"
            rows={3}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full duo-input text-xs"
          />
        </div>
      </form>

      {/* Privacy & Data Ownership Section in Duolingo 3D Card */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black border-2 border-sky-300">
            <Shield className="w-4 h-4 text-sky-700" />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Data Privacy & Ownership Controls
          </h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">{en.privacy.signupNote}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Export Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">{en.privacy.exportTitle}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                {en.privacy.exportDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 duo-btn-sky text-xs flex items-center gap-1.5 uppercase tracking-wider self-start cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>
          </div>

          {/* Delete Card */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-rose-800 dark:text-rose-300">
                {en.privacy.deleteTitle}
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 leading-relaxed font-medium">
                {en.privacy.deleteDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playPopSound();
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl border-b-4 border-rose-800 flex items-center gap-1.5 uppercase tracking-wider self-start cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE ACCOUNT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 duo-card max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {en.privacy.deleteTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {en.privacy.deleteConfirmPrompt}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 duo-btn-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2 bg-rose-600 text-white font-black text-xs rounded-xl border-b-4 border-rose-800 cursor-pointer"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
