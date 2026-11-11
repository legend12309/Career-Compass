import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Skill, SkillCategory, Certificate } from '../types';
import {
  listSkills,
  saveSkill,
  deleteSkill,
  listCertificates,
  saveCertificate,
  deleteCertificate,
  awardXp,
} from '../services/db';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import {
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  X,
  Star,
  Zap,
} from 'lucide-react';

const MAX_CERT_FILE_BYTES = 450 * 1024;

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('technical');
  const [skillLevel, setSkillLevel] = useState<number>(3);

  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certFileUrl, setCertFileUrl] = useState<string | undefined>(undefined);
  const [certFileName, setCertFileName] = useState<string | undefined>(undefined);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'skill' | 'cert';
    id: string;
    label: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sk, ct] = await Promise.all([listSkills(), listCertificates()]);
        setSkills(sk);
        setCertificates(ct);
      } catch (err) {
        console.error('Error loading skills:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSkill = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setFeedback(null);
    try {
      const saved = await saveSkill({
        id: editingSkillId || `sk-${Date.now()}`,
        name: skillName,
        category: skillCategory,
        level: skillLevel,
      });
      setSkills((prev) => {
        const exists = prev.some((s) => s.id === saved.id);
        return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
      });
      setSkillName('');
      setSkillLevel(3);
      setEditingSkillId(null);

      await awardXp(20, 'Logged Skill');
      sounds.playCorrectSound();
      setXpToast({ show: true, text: '+20 XP! Skill Leveled Up ⭐' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2200);

      setFeedback({ type: 'success', text: 'Skill saved successfully.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save skill.',
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) {
      setCertFileUrl(undefined);
      setCertFileName(undefined);
      return;
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFeedback({
        type: 'error',
        text: 'Only PDF or PNG/JPEG/WEBP images are supported.',
      });
      return;
    }
    if (file.size > MAX_CERT_FILE_BYTES) {
      setFeedback({
        type: 'error',
        text: `File exceeds 450 KB limit (${(file.size / 1024).toFixed(1)} KB). Please compress it first.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileUrl(reader.result as string);
      setCertFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCert = async (e: FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    setFeedback(null);
    try {
      const saved = await saveCertificate({
        id: `cert-${Date.now()}`,
        title: certTitle,
        issuer: certIssuer,
        date: certDate,
        fileDataUrl: certFileUrl,
        fileName: certFileName,
      });
      setCertificates((prev) => [saved, ...prev]);
      setCertTitle('');
      setCertIssuer('');
      setCertDate('');
      setCertFileUrl(undefined);
      setCertFileName(undefined);

      await awardXp(35, 'Certificate Uploaded');
      sounds.playCorrectSound();
      fireConfetti();
      setXpToast({ show: true, text: '+35 XP! Credential Certified 🏆' });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2500);

      setFeedback({ type: 'success', text: 'Certificate logged in your vault.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save certificate.',
      });
    }
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDelete) return;
    sounds.playPopSound();
    try {
      if (confirmDelete.type === 'skill') {
        await deleteSkill(confirmDelete.id);
        setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
      } else {
        await deleteCertificate(confirmDelete.id);
        setCertificates((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      }
      setFeedback({ type: 'success', text: `Removed "${confirmDelete.label}".` });
    } finally {
      setConfirmDelete(null);
    }
  };

  const groups: { key: SkillCategory; label: string; badge: string; color: string }[] = [
    { key: 'technical', label: 'Technical Skills', badge: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700', color: 'emerald' },
    { key: 'domain', label: 'Domain & Field Competencies', badge: 'bg-amber-100 text-amber-800 border-2 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700', color: 'amber' },
    { key: 'soft', label: 'Interpersonal & Leadership', badge: 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700', color: 'indigo' },
    { key: 'language', label: 'Languages', badge: 'bg-rose-100 text-rose-800 border-2 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', color: 'rose' },
  ];

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Floating Gamified XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Compy Mascot Header */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center gap-4 shadow-sm">
        <CompyMascot mood="happy" size="md" />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-[10px] uppercase tracking-wider mb-1">
            <Award className="w-3 h-3" />
            <span>Credential Vault</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Skills & Credential Mastery
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Log your skills with 1–5 star ratings and store verified credentials locally in your browser.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-2 text-xs font-black shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Skill Groups & Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Skill Form Card */}
          <form
            onSubmit={handleSaveSkill}
            className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              {editingSkillId ? 'Update Skill' : 'Log New Skill (+20 XP)'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="sk-name" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Skill Name *
                </label>
                <input
                  id="sk-name"
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Patient Care, Financial Accounting"
                  className="w-full duo-input text-xs"
                />
              </div>
              <div>
                <label htmlFor="sk-cat" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="sk-cat"
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
                  className="w-full duo-input text-xs"
                >
                  <option value="technical">Technical</option>
                  <option value="domain">Domain</option>
                  <option value="soft">Soft</option>
                  <option value="language">Language</option>
                </select>
              </div>
            </div>

            {/* Duolingo Clickable 5-Star Rating Selector */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <label htmlFor="sk-lvl">Proficiency Level ({skillLevel}/5 Stars)</label>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      sounds.playPopSound();
                      setSkillLevel(star);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-b-4 ${
                      star <= skillLevel
                        ? 'bg-amber-400 text-amber-950 border-amber-600 scale-105 shadow-sm'
                        : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${star <= skillLevel ? 'fill-amber-950' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingSkillId ? 'UPDATE SKILL' : 'SAVE SKILL (+20 XP)'}</span>
              </button>
            </div>
          </form>

          {/* Grouped Skills List */}
          {!loading &&
            groups.map((g) => {
              const items = skills.filter((s) => s.category === g.key);
              return (
                <div
                  key={g.key}
                  className="bg-white dark:bg-slate-900 duo-card p-5 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl ${g.badge}`}>
                      {g.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {items.length} logged
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400 py-2">
                      No skills added in this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((sk) => (
                        <div
                          key={sk.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {sk.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((st) => (
                                <Star
                                  key={st}
                                  className={`w-3 h-3 ${
                                    st <= sk.level
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playPopSound();
                                setEditingSkillId(sk.id);
                                setSkillName(sk.name);
                                setSkillCategory(sk.category);
                                setSkillLevel(sk.level);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({
                                  type: 'skill',
                                  id: sk.id,
                                  label: sk.name,
                                })
                              }
                              className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Right Column: Certificate Vault */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSaveCert}
            className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Add Certificate / Credential (+35 XP)</span>
            </h2>

            <div>
              <label htmlFor="ct-title" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Certificate Title *
              </label>
              <input
                id="ct-title"
                type="text"
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. AWS Solutions Architect, BLS Certification"
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="ct-issuer" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Issuing Organization *
              </label>
              <input
                id="ct-issuer"
                type="text"
                required
                value={certIssuer}
                onChange={(e) => setCertIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services, Red Cross, Coursera"
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="ct-date" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Issue Date *
              </label>
              <input
                id="ct-date"
                type="date"
                required
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
                className="w-full duo-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Upload File (PDF / Image, Max 450 KB)
              </label>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              {certFileName && (
                <p className="text-[11px] font-bold text-emerald-600 mt-1">
                  Selected: {certFileName}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 duo-btn-green text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>LOG CERTIFICATE (+35 XP)</span>
            </button>
          </form>

          {/* Certificate Items List */}
          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 duo-card p-6 text-center text-xs text-slate-400 font-bold">
                No certificates uploaded yet.
              </div>
            ) : (
              certificates.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 duo-card p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        {c.title}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500">
                        {c.issuer} · {c.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          type: 'cert',
                          id: c.id,
                          label: c.title,
                        })
                      }
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {c.fileDataUrl && (
                    <a
                      href={c.fileDataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-black text-sky-600 hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Credential Document ↗</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 duo-card max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Delete Confirmation
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Are you sure you want to remove "{confirmDelete.label}"?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 duo-btn-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl border-b-4 border-rose-800 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
