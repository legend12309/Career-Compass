import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getResume,
  saveResume,
  getLastResumeReview,
  saveResumeReview,
  getProfile,
  awardXp,
} from '../services/db';
import { reviewResume } from '../services/ai';
import {
  Resume,
  ResumeMode,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  OptionalSection,
  OptionalSectionType,
} from '../types';
import { ResumeReviewOutput, ResumeReviewSuggestion } from '../types/ai';
import { ResumeLivePreview } from '../components/resume/ResumeLivePreview';
import { exportResumeToPdf } from '../utils/pdfExport';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import {
  FileText,
  Download,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Wand2,
  Zap,
} from 'lucide-react';

const EMPTY_RESUME: Omit<Resume, 'userId'> = {
  mode: 'fresher',
  personal: {
    name: '',
    email: '',
    phone: '',
    location: '',
    links: [''],
  },
  summary: '',
  education: [
    {
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      scoreOrCgpa: '',
    },
  ],
  experience: [],
  projects: [
    {
      title: '',
      techStack: [],
      link: '',
      description: '',
    },
  ],
  skills: [],
  certifications: [],
  optionalSections: [],
};

const OPTIONAL_SECTION_LABELS: Record<OptionalSectionType, string> = {
  volunteering: 'Volunteering & Community Work',
  languages: 'Spoken & Written Languages',
  achievements: 'Awards & Achievements',
  publications: 'Publications & Research Papers',
  extracurricular: 'Leadership & Extracurriculars',
};

export const ResumePage: React.FC = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState<Resume>({
    ...EMPTY_RESUME,
    userId: user?.id || '',
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [certsInput, setCertsInput] = useState('');
  const [linksInput, setLinksInput] = useState('');
  const [review, setReview] = useState<ResumeReviewOutput | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [appliedIndexes, setAppliedIndexes] = useState<number[]>([]);
  const [targetRoleHint, setTargetRoleHint] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      const [existing, savedReview, prof] = await Promise.all([
        getResume(),
        getLastResumeReview(),
        getProfile(),
      ]);
      if (!active) return;

      if (prof?.careerGoal) {
        setTargetRoleHint(prof.careerGoal);
      }

      if (existing) {
        setResume(existing);
        setSkillsInput(existing.skills.join(', '));
        setCertsInput(existing.certifications.join('\n'));
        setLinksInput((existing.personal.links || []).join(', '));
      } else {
        const seeded: Resume = {
          ...EMPTY_RESUME,
          userId: user.id,
          personal: {
            ...EMPTY_RESUME.personal,
            name: user.name,
            email: user.email,
            location: prof?.country || '',
          },
        };
        setResume(seeded);
      }
      if (savedReview) {
        setReview(savedReview);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const syncResumeDraft = (
    draft: Resume,
    rawSkills = skillsInput,
    rawCerts = certsInput,
    rawLinks = linksInput
  ): Resume => {
    const parsedSkills = rawSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedCerts = rawCerts
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);
    const parsedLinks = rawLinks
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    return {
      ...draft,
      personal: {
        ...draft.personal,
        links: parsedLinks,
      },
      skills: parsedSkills,
      certifications: parsedCerts,
    };
  };

  const handleSave = async () => {
    sounds.playPopSound();
    try {
      const updated = syncResumeDraft(resume);
      const saved = await saveResume(updated);
      setResume(saved);
      await awardXp(25, 'Resume Saved');
      sounds.playCorrectSound();
      setSaveToast('Resume saved (+25 XP)! 🎉');
      setTimeout(() => setSaveToast(null), 2500);
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Failed to save resume.');
    }
  };

  const handleDownloadPdf = async () => {
    sounds.playPopSound();
    const updated = syncResumeDraft(resume);
    const saved = await saveResume(updated);
    setResume(saved);
    exportResumeToPdf(saved);
  };

  const handleRunAiReview = async () => {
    sounds.playPopSound();
    setReviewError(null);
    const updated = syncResumeDraft(resume);
    const saved = await saveResume(updated);
    setResume(saved);

    const hasContent =
      saved.summary.trim().length > 10 ||
      saved.education.some((e) => e.degree.trim()) ||
      saved.projects.some((p) => p.title.trim()) ||
      saved.experience.some((ex) => ex.role.trim());

    if (!hasContent) {
      setReviewError(
        'Please add a brief summary, education, or at least one project/experience before requesting an AI review.'
      );
      return;
    }

    setIsReviewing(true);
    setAppliedIndexes([]);
    try {
      const result = await reviewResume(saved, {
        targetRole: targetRoleHint || 'General Role',
        experienceLevel: saved.mode,
      });
      setReview(result);
      await saveResumeReview(result);
      await saveResume({ ...saved, lastScore: result.score });
      setResume((prev) => ({ ...prev, lastScore: result.score }));

      await awardXp(40, 'ATS Resume Reviewed');
      sounds.playCorrectSound();
      if (result.score >= 70) {
        fireConfetti();
      }
    } catch (err: unknown) {
      setReviewError(
        err instanceof Error ? err.message : 'Could not complete AI review. Please try again.'
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApplySuggestion = async (suggestion: ResumeReviewSuggestion, idx: number) => {
    const sec = suggestion.section.toLowerCase();
    const updated = syncResumeDraft(resume);

    if (sec.includes('summary') || sec.includes('objective') || sec.includes('profile')) {
      updated.summary = suggestion.improvedText;
    } else if (sec.includes('project') && updated.projects.length > 0) {
      updated.projects = updated.projects.map((p, i) =>
        i === 0 ? { ...p, description: suggestion.improvedText } : p
      );
    } else if (sec.includes('experience') && updated.experience.length > 0) {
      updated.experience = updated.experience.map((e, i) =>
        i === 0 ? { ...e, description: suggestion.improvedText } : e
      );
    } else if (sec.includes('skill')) {
      const extraSkills = suggestion.improvedText
        .split(/[,•|]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...updated.skills, ...extraSkills]));
      updated.skills = merged;
      setSkillsInput(merged.join(', '));
    } else {
      updated.summary = updated.summary
        ? `${updated.summary}\n${suggestion.improvedText}`
        : suggestion.improvedText;
    }

    const saved = await saveResume(updated);
    setResume(saved);
    setAppliedIndexes((prev) => [...prev, idx]);
    setSaveToast(`Applied suggestion to ${suggestion.section}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const updateEducation = (idx: number, field: keyof EducationItem, value: string) => {
    const next = [...resume.education];
    next[idx] = { ...next[idx], [field]: value };
    setResume({ ...resume, education: next });
  };

  const updateExperience = (idx: number, field: keyof ExperienceItem, value: string) => {
    const next = [...resume.experience];
    next[idx] = { ...next[idx], [field]: value };
    setResume({ ...resume, experience: next });
  };

  const updateProject = (idx: number, field: keyof ProjectItem, value: string | string[]) => {
    const next = [...resume.projects];
    next[idx] = { ...next[idx], [field]: value };
    setResume({ ...resume, projects: next });
  };

  const addOptionalSection = (type: OptionalSectionType) => {
    if (resume.optionalSections.some((s) => s.type === type)) return;
    const next: OptionalSection[] = [
      ...resume.optionalSections,
      { type, title: OPTIONAL_SECTION_LABELS[type], items: [''] },
    ];
    setResume({ ...resume, optionalSections: next });
  };

  const updateOptionalItems = (type: OptionalSectionType, rawText: string) => {
    const next = resume.optionalSections.map((sec) =>
      sec.type === type ? { ...sec, items: rawText.split('\n') } : sec
    );
    setResume({ ...resume, optionalSections: next });
  };

  const removeOptionalSection = (type: OptionalSectionType) => {
    setResume({
      ...resume,
      optionalSections: resume.optionalSections.filter((s) => s.type !== type),
    });
  };

  const liveResume = syncResumeDraft(resume);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header with Compy Coach */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <CompyMascot mood={review ? (review.score >= 70 ? 'celebrating' : 'happy') : 'thinking'} size="md" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>ATS Resume Studio</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Resume Builder & AI Scorecard
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Build an ATS-optimized single-column resume and score 80+ for maximum recruiter visibility.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {saveToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-pastel-mint px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              {saveToast}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 duo-btn-sky text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={handleRunAiReview}
            disabled={isReviewing}
            className="px-5 py-2.5 duo-btn-green text-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI REVIEW (+40 XP)</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 duo-btn-white text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Duolingo 3D Card */}
      <div className="bg-white dark:bg-slate-900 duo-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Resume Format Mode
          </span>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Adapts section ordering automatically for freshers, experienced pros, or researchers.
          </p>
        </div>
        <div className="inline-flex gap-2">
          {(
            [
              { id: 'fresher', label: 'Fresher / Entry' },
              { id: 'experienced', label: 'Experienced Pro' },
              { id: 'academic', label: 'Academic CV' },
            ] as { id: ResumeMode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                sounds.playPopSound();
                setResume({ ...resume, mode: m.id });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                resume.mode === m.id
                  ? 'duo-btn-green text-white'
                  : 'duo-btn-white text-slate-700 dark:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {reviewError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{reviewError}</span>
          </div>
          <button
            type="button"
            onClick={handleRunAiReview}
            className="px-3 py-1 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* AI Review Scorecard (Professional Style) */}
      {review && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex flex-col items-center justify-center font-bold shadow-xs shrink-0">
                <span className="text-xl leading-none">{review.score}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">/100</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  AI Resume Scorecard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Keyword density, impact metrics, and clarity review for your target role.
                </p>
              </div>
            </div>
            {review.keywordsMissing.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">
                  Missing Keywords:
                </span>
                {review.keywordsMissing.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg p-4 space-y-2 text-slate-800 dark:text-slate-200">
              <h3 className="font-bold uppercase tracking-wider text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
              </h3>
              <ul className="space-y-1 font-medium list-disc list-inside text-emerald-950 dark:text-emerald-200">
                {review.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-4 space-y-2 text-slate-800 dark:text-slate-200">
              <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Opportunities to Improve
              </h3>
              <ul className="space-y-1 font-medium list-disc list-inside text-amber-950 dark:text-amber-200">
                {review.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {review.suggestions.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider opacity-80 mb-3">
                One-Click Suggested Improvements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {review.suggestions.map((sug, idx) => {
                  const isApplied = appliedIndexes.includes(idx);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-lg p-4 flex flex-col justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded mb-2">
                          {sug.section}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                          <strong className="text-slate-900 dark:text-white">Issue:</strong>{' '}
                          {sug.issue}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-md p-2.5 font-medium border border-slate-200 dark:border-slate-700">
                          <strong className="text-emerald-700 dark:text-emerald-400 block mb-0.5">
                            Suggested Improvement:
                          </strong>{' '}
                          {sug.improvedText}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isApplied}
                        onClick={() => handleApplySuggestion(sug, idx)}
                        className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:bg-emerald-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {isApplied ? 'Applied to Resume' : 'Apply to Resume'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Split Screen Editor + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 space-y-5">
          {/* Personal Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resume.personal.name}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={resume.personal.email}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={resume.personal.phone}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City & Country
                </label>
                <input
                  type="text"
                  value={resume.personal.location}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, location: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Portfolio / Profile Links (comma-separated)
                </label>
                <input
                  type="text"
                  value={linksInput}
                  onChange={(e) => setLinksInput(e.target.value)}
                  placeholder="linkedin.com/in/yourname, portfolio.example.com"
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Professional Summary
            </h2>
            <textarea
              rows={3}
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              placeholder="Write 2–3 clear sentences summarizing your background, strengths, and career goal..."
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Education */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Education
              </h2>
              <button
                type="button"
                onClick={() =>
                  setResume({
                    ...resume,
                    education: [
                      ...resume.education,
                      { degree: '', institution: '', startYear: '', endYear: '', scoreOrCgpa: '' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] dark:text-amber-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>
            {resume.education.map((edu, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Qualification #{idx + 1}
                  </span>
                  {resume.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setResume({
                          ...resume,
                          education: resume.education.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Degree / Diploma / School Certificate"
                    value={edu.degree}
                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Institution / School / University"
                    value={edu.institution}
                    onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={edu.startYear}
                    onChange={(e) => updateEducation(idx, 'startYear', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="End Year"
                    value={edu.endYear}
                    onChange={(e) => updateEducation(idx, 'endYear', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Grade / Percentage / CGPA"
                    value={edu.scoreOrCgpa}
                    onChange={(e) => updateEducation(idx, 'scoreOrCgpa', e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Experience */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                4. Work, Internships & Practical Experience
              </h2>
              <button
                type="button"
                onClick={() =>
                  setResume({
                    ...resume,
                    experience: [
                      ...resume.experience,
                      {
                        role: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] dark:text-amber-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>
            {resume.experience.map((exp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Role #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setResume({
                        ...resume,
                        experience: resume.experience.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Role Title"
                    value={exp.role}
                    onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Organization / Hospital / Firm / Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Start Date (e.g., May 2025)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="End Date (or Present)"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="What did you accomplish? Include numbers or measurable outcomes where possible."
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                5. Projects, Case Studies & Research
              </h2>
              <button
                type="button"
                onClick={() =>
                  setResume({
                    ...resume,
                    projects: [
                      ...resume.projects,
                      { title: '', techStack: [], link: '', description: '' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] dark:text-amber-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>
            {resume.projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Project #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setResume({
                        ...resume,
                        projects: resume.projects.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Project or Case Study Title"
                    value={proj.title}
                    onChange={(e) => updateProject(idx, 'title', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Tools, Methods, or Skills Used (comma-separated)"
                    value={proj.techStack.join(', ')}
                    onChange={(e) =>
                      updateProject(
                        idx,
                        'techStack',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Describe the problem you solved and the result."
                    value={proj.description}
                    onChange={(e) => updateProject(idx, 'description', e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Skills & Certifications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              6. Skills & Certifications
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Patient Care, Financial Accounting, React, Public Speaking..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Certifications & Licenses (one per line)
              </label>
              <textarea
                rows={3}
                value={certsInput}
                onChange={(e) => setCertsInput(e.target.value)}
                placeholder="First Aid & CPR Certified (2025)&#10;Full-Stack Web Development Certificate (2026)"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Optional Sections */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              7. Optional Sections
            </h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OPTIONAL_SECTION_LABELS) as OptionalSectionType[]).map((type) => {
                const exists = resume.optionalSections.some((s) => s.type === type);
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={exists}
                    onClick={() => addOptionalSection(type)}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    + {OPTIONAL_SECTION_LABELS[type]}
                  </button>
                );
              })}
            </div>

            {resume.optionalSections.map((sec) => (
              <div
                key={sec.type}
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {sec.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOptionalSection(sec.type)}
                    className="text-xs text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={sec.items.join('\n')}
                  onChange={(e) => updateOptionalItems(sec.type, e.target.value)}
                  placeholder="Enter one item per line..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold uppercase tracking-wider">Live A4 Print Preview</span>
            <span>Single-Column • ATS-Readable</span>
          </div>
          <ResumeLivePreview resume={liveResume} />
        </div>
      </div>
    </div>
  );
};
