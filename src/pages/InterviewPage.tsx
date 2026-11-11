import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProfile,
  getInterviewSession,
  saveInterviewSession,
  clearInterviewSession,
  awardXp,
} from '../services/db';
import { generateInterviewQuestions, evaluateAnswer } from '../services/ai';
import { InterviewSessionState } from '../types';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  Award,
  ArrowRight,
  Zap,
  HelpCircle,
  Trophy,
} from 'lucide-react';

export const InterviewPage: React.FC = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('Full-Stack Developer');
  const [field, setField] = useState('Software & Web Development');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    'Intermediate'
  );
  const [interviewType, setInterviewType] = useState<'technical' | 'hr' | 'mixed' | 'viva'>(
    'mixed'
  );
  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [saved, profile] = await Promise.all([getInterviewSession(), getProfile()]);
        if (saved) {
          setSession(saved);
          const currentQ = saved.questions[saved.currentIndex];
          if (currentQ && saved.answers[currentQ.id]) {
            setCurrentAnswer(saved.answers[currentQ.id].userAnswer || '');
          }
        } else if (profile) {
          if (profile.careerGoal) setRole(profile.careerGoal);
          if (profile.fieldOfStudy) setField(profile.fieldOfStudy);
        }
      } catch (err) {
        console.error('Error loading interview session:', err);
      }
    }
    load();
  }, [user]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    if (!role.trim() || !field.trim()) {
      setError('Please provide both your target role and field of study/work.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const generated = await generateInterviewQuestions({
        role: role.trim(),
        field: field.trim(),
        difficulty,
        type: interviewType,
      });

      const newSession: InterviewSessionState = {
        userId: user?.id || '',
        role: role.trim(),
        field: field.trim(),
        difficulty,
        type: interviewType,
        questions: generated.questions,
        currentIndex: 0,
        answers: {},
        completed: false,
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveInterviewSession(newSession);
      setSession(saved);
      setCurrentAnswer('');
      sounds.playCorrectSound();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate questions. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session) return;
    const currentQ = session.questions[session.currentIndex];
    if (!currentQ) return;

    const trimmed = currentAnswer.trim();
    if (!trimmed) {
      setError('Please type your response before submitting.');
      return;
    }

    sounds.playPopSound();
    setError(null);
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateAnswer(currentQ.question, trimmed);
      const updatedAnswers = {
        ...session.answers,
        [currentQ.id]: {
          userAnswer: trimmed,
          skipped: false,
          evaluation,
        },
      };
      const saved = await saveInterviewSession({
        ...session,
        answers: updatedAnswers,
        updatedAt: new Date().toISOString(),
      });
      setSession(saved);

      await awardXp(30, 'Interview Question Evaluated');
      sounds.playCorrectSound();
      if (evaluation.score >= 7) {
        fireConfetti();
      }
      setXpToast({ show: true, text: `+30 XP! Graded ${evaluation.score}/10 🎉` });
      setTimeout(() => setXpToast({ show: false, text: '' }), 2500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not evaluate answer. Please try again.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!session) return;
    sounds.playPopSound();
    const currentQ = session.questions[session.currentIndex];
    if (!currentQ) return;

    const updatedAnswers = {
      ...session.answers,
      [currentQ.id]: {
        userAnswer: '',
        skipped: true,
      },
    };
    const isLast = session.currentIndex >= session.questions.length - 1;
    const nextIndex = isLast ? session.currentIndex : session.currentIndex + 1;
    const saved = await saveInterviewSession({
      ...session,
      answers: updatedAnswers,
      currentIndex: nextIndex,
      completed: isLast,
      updatedAt: new Date().toISOString(),
    });
    setSession(saved);
    const nextQ = saved.questions[nextIndex];
    setCurrentAnswer((nextQ && saved.answers[nextQ.id]?.userAnswer) || '');
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    sounds.playPopSound();
    const isLast = session.currentIndex >= session.questions.length - 1;
    if (isLast) {
      const saved = await saveInterviewSession({
        ...session,
        completed: true,
        updatedAt: new Date().toISOString(),
      });
      setSession(saved);
      sounds.playFanfare();
      fireConfetti();
      return;
    }
    const nextIndex = session.currentIndex + 1;
    const saved = await saveInterviewSession({
      ...session,
      currentIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    });
    setSession(saved);
    const nextQ = saved.questions[nextIndex];
    setCurrentAnswer((nextQ && saved.answers[nextQ.id]?.userAnswer) || '');
  };

  const handleReset = async () => {
    sounds.playPopSound();
    await clearInterviewSession();
    setSession(null);
    setCurrentAnswer('');
    setError(null);
  };

  const currentQuestion = session ? session.questions[session.currentIndex] : null;
  const currentRecord =
    session && currentQuestion ? session.answers[currentQuestion.id] : undefined;

  const answeredEvaluations = session
    ? Object.values(session.answers).filter((a) => a.evaluation)
    : [];
  const averageScore =
    answeredEvaluations.length > 0
      ? (
          answeredEvaluations.reduce((acc, a) => acc + (a.evaluation?.score || 0), 0) /
          answeredEvaluations.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Floating Gamified XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Compy Mascot Coach Banner */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <CompyMascot
            mood={session?.completed ? 'celebrating' : currentRecord?.evaluation ? 'happy' : 'thinking'}
            size="md"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider mb-1">
              <Award className="w-3 h-3" />
              <span>Coach Compy</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Interactive Mock Interview Studio
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Practice role-specific viva and job questions with instant feedback and sample answers.
            </p>
          </div>
        </div>

        {session && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 duo-btn-white text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Session State 1: Configuration Form */}
      {!session ? (
        <form
          onSubmit={handleStartSession}
          className="bg-white dark:bg-slate-900 duo-card p-6 sm:p-7 space-y-5 max-w-2xl shadow-sm"
        >
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Configure Practice Session
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Select your domain and difficulty to generate 5 targeted interview questions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Target Role or Exam Topic
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Registered Nurse, Full-Stack Developer, Accountant"
                className="w-full duo-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Field or Subject Area
              </label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="e.g. Healthcare, Commerce, Law, Design, Tech"
                className="w-full duo-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')
                }
                className="w-full duo-input text-xs"
              >
                <option value="Beginner">Beginner / Entry-Level</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced / Senior</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Question Style
              </label>
              <select
                value={interviewType}
                onChange={(e) =>
                  setInterviewType(e.target.value as 'technical' | 'hr' | 'mixed' | 'viva')
                }
                className="w-full duo-input text-xs"
              >
                <option value="mixed">Mixed (Domain + Behavioral)</option>
                <option value="technical">Domain / Role-Specific</option>
                <option value="hr">HR & Behavioral</option>
                <option value="viva">Academic / Oral Viva</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 duo-btn-green text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating 5 Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>START PRACTICE ROUND (+150 XP)</span>
              </>
            )}
          </button>
        </form>
      ) : session.completed ? (
        /* Session State 2: Completed Scorecard */
        <div className="bg-white dark:bg-slate-900 duo-card p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md border-b-4 border-amber-600 shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Session Complete: {session.role}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Overall Score: <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{averageScore} / 10</strong> across{' '}
                  {answeredEvaluations.length} evaluated questions
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 duo-btn-green text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Another Topic</span>
            </button>
          </div>

          <div className="space-y-4">
            {session.questions.map((q, i) => {
              const ans = session.answers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 dark:text-white">
                      Q{i + 1}: {q.question}
                    </span>
                    {ans?.evaluation ? (
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-black text-xs">
                        {ans.evaluation.score} / 10
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs">
                        Skipped
                      </span>
                    )}
                  </div>
                  {ans?.userAnswer && (
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      <strong>Your Answer:</strong> {ans.userAnswer}
                    </p>
                  )}
                  {ans?.evaluation && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 space-y-1">
                        <strong className="block font-black uppercase text-[11px] text-amber-800 dark:text-amber-400">Feedback:</strong>
                        <p className="font-semibold">{ans.evaluation.feedback}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 space-y-1">
                        <strong className="block font-black uppercase text-[11px] text-emerald-800 dark:text-emerald-400">Model Answer:</strong>
                        <p className="font-semibold">{ans.evaluation.improvedAnswer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Session State 3: Active Question View */
        currentQuestion && (
          <div className="bg-white dark:bg-slate-900 duo-card p-6 sm:p-8 space-y-5 shadow-sm">
            {/* Question Progress Header */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Question {session.currentIndex + 1} of {session.questions.length} ({currentQuestion.type})
              </span>
              <span className="font-bold">
                {session.role} · {session.difficulty}
              </span>
            </div>

            {/* Duolingo Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((session.currentIndex + (currentRecord?.evaluation ? 1 : 0)) / session.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Speech Bubble with Compy */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-200 dark:border-sky-800">
              <CompyMascot mood="thinking" size="sm" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-0.5">
                  Interviewer asks:
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {currentQuestion.question}
                </h3>
              </div>
            </div>

            <textarea
              rows={5}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={Boolean(currentRecord?.evaluation)}
              placeholder="Type your answer as you would explain it in an interview..."
              className="w-full duo-input text-xs"
            />

            {!currentRecord?.evaluation ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluating}
                  className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-60"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>EVALUATING ANSWER...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SUBMIT ANSWER (+30 XP)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={isEvaluating}
                  className="px-4 py-2.5 duo-btn-white text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Question</span>
                </button>
              </div>
            ) : (
              /* Signature Duolingo Bright Green slide-up feedback box */
              <div className="space-y-4 pt-4 border-t-2 border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                        Nicely done! Answer Evaluated
                      </h4>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Score: {currentRecord.evaluation.score} / 10
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 duo-btn-green text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
                  >
                    <span>
                      {session.currentIndex >= session.questions.length - 1
                        ? 'FINISH SESSION'
                        : 'CONTINUE'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 space-y-1">
                    <h4 className="font-black uppercase text-[11px] text-amber-800 dark:text-amber-400">Coach Feedback</h4>
                    <p className="font-semibold leading-relaxed">
                      {currentRecord.evaluation.feedback}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200 space-y-1">
                    <h4 className="font-black uppercase text-[11px] text-emerald-800 dark:text-emerald-400">Stronger Sample Answer</h4>
                    <p className="font-semibold leading-relaxed">
                      {currentRecord.evaluation.improvedAnswer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
