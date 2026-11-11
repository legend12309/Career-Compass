import React, { useState } from 'react';
import { CompyMascot } from '../mascot/CompyMascot';
import { sounds } from '../../utils/soundEffects';
import { fireConfetti } from '../../utils/confetti';
import {
  X,
  CheckCircle2,
  XCircle,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface DuolingoLessonModalProps {
  topicTitle: string;
  phaseTitle: string;
  onClose: () => void;
  onComplete: () => void;
}

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

/**
 * Generates engaging, field-appropriate bite-sized quiz options for any topic title
 */
function generateQuizForTopic(topic: string): { question: string; choices: Choice[] } {
  const clean = topic.toLowerCase();

  if (clean.includes('css') || clean.includes('html') || clean.includes('web')) {
    return {
      question: `When building modern interfaces for "${topic}", what is the primary accessibility rule?`,
      choices: [
        {
          id: 'c1',
          text: 'Use semantic HTML elements and clear contrast ratios so all users can navigate easily.',
          isCorrect: true,
          explanation: 'Semantic elements provide built-in screen reader support and keyboard focus.',
        },
        {
          id: 'c2',
          text: 'Rely only on images of text to ensure identical pixel rendering across devices.',
          isCorrect: false,
          explanation: 'Images of text harm accessibility, search engines, and screen zoom.',
        },
        {
          id: 'c3',
          text: 'Disable keyboard outline focus states for all interactive links.',
          isCorrect: false,
          explanation: 'Removing focus rings makes keyboard navigation impossible for many users.',
        },
      ],
    };
  }

  if (clean.includes('react') || clean.includes('component') || clean.includes('vue') || clean.includes('ui')) {
    return {
      question: `What is the core best practice when developing "${topic}"?`,
      choices: [
        {
          id: 'c1',
          text: 'Keep components modular, single-responsibility, and pass data clearly via props.',
          isCorrect: true,
          explanation: 'Modular components are easy to test, maintain, and reuse across views.',
        },
        {
          id: 'c2',
          text: 'Store all application state inside global window variables.',
          isCorrect: false,
          explanation: 'Global state causes race conditions, hard-to-find bugs, and memory leaks.',
        },
        {
          id: 'c3',
          text: 'Combine all screens into one giant monolithic file.',
          isCorrect: false,
          explanation: 'Monolithic files hurt maintainability, code splitting, and bundle size.',
        },
      ],
    };
  }

  if (clean.includes('api') || clean.includes('backend') || clean.includes('database') || clean.includes('sql') || clean.includes('node')) {
    return {
      question: `When designing reliable backend systems for "${topic}", what is critical?`,
      choices: [
        {
          id: 'c1',
          text: 'Validate all client inputs at the server boundary with strict schemas.',
          isCorrect: true,
          explanation: 'Server-side validation protects against injection, malformed payloads, and crashes.',
        },
        {
          id: 'c2',
          text: 'Trust all client data unconditionally without type or length checks.',
          isCorrect: false,
          explanation: 'Untrusted input leads to severe security vulnerabilities and database corruption.',
        },
        {
          id: 'c3',
          text: 'Hardcode database passwords directly into frontend client assets.',
          isCorrect: false,
          explanation: 'Secrets must never be exposed to the client browser.',
        },
      ],
    };
  }

  // Universal fallback for healthcare, legal, commerce, trades, design, arts, or any domain
  return {
    question: `To demonstrate practical mastery of "${topic}", what is the most effective approach?`,
    choices: [
      {
        id: 'c1',
        text: 'Apply standard guidelines, verify with real-world scenarios, and document your learnings.',
        isCorrect: true,
        explanation: 'Active practice and verification solidify real workplace competence.',
      },
      {
        id: 'c2',
        text: 'Only memorize theoretical definitions without doing any practical work.',
        isCorrect: false,
        explanation: 'Workplace readiness requires hands-on problem solving, not just memorization.',
      },
      {
        id: 'c3',
        text: 'Skip foundational concepts and guess on every workflow step.',
        isCorrect: false,
        explanation: 'Strong foundations prevent costly errors in professional practice.',
      },
    ],
  };
}

export const DuolingoLessonModal: React.FC<DuolingoLessonModalProps> = ({
  topicTitle,
  phaseTitle,
  onClose,
  onComplete,
}) => {
  const quiz = generateQuizForTopic(topicTitle);

  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (id: string) => {
    if (isChecked) return;
    sounds.playPopSound();
    setSelectedChoiceId(id);
  };

  const handleCheck = () => {
    if (!selectedChoiceId) return;
    const choice = quiz.choices.find((c) => c.id === selectedChoiceId);
    if (!choice) return;

    setIsChecked(true);
    if (choice.isCorrect) {
      setIsCorrect(true);
      sounds.playCorrectSound();
      fireConfetti();
    } else {
      setIsCorrect(false);
      sounds.playPopSound();
    }
  };

  const handleContinue = () => {
    sounds.playFanfareSound();
    onComplete();
  };

  const handleRetry = () => {
    setIsChecked(false);
    setSelectedChoiceId(null);
  };

  const selectedChoice = quiz.choices.find((c) => c.id === selectedChoiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Duolingo Lesson Card */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-b-6 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header with Progress Bar and HUD */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Duolingo Progress Bar */}
          <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: isCorrect ? '100%' : selectedChoiceId ? '60%' : '20%' }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              +50 XP
            </span>
          </div>
        </div>

        {/* Lesson Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {/* Phase Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
              {phaseTitle}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Interactive Milestone
            </span>
          </div>

          {/* Compy Mascot with Speech Bubble Question */}
          <div className="flex items-start gap-4">
            <CompyMascot
              mood={isCorrect ? 'celebrating' : selectedChoiceId ? 'happy' : 'thinking'}
              size="md"
            />
            <div className="relative bg-slate-50 dark:bg-slate-800/80 border-2 border-b-4 border-slate-200 dark:border-slate-700 border-b-slate-300 dark:border-b-slate-900 p-4 rounded-2xl flex-1">
              {/* Pointer Triangle */}
              <div className="absolute -left-2 top-6 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-slate-200 dark:border-r-slate-700 border-b-6 border-b-transparent" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                {quiz.question}
              </h3>
            </div>
          </div>

          {/* 3 Interactive Duolingo Choice Cards */}
          <div className="space-y-3 pt-2">
            {quiz.choices.map((choice, idx) => {
              const isSelected = selectedChoiceId === choice.id;
              let cardStyle = 'bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 border-b-slate-300 dark:border-b-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300';

              if (isSelected && !isChecked) {
                cardStyle = 'bg-indigo-50 dark:bg-indigo-950/40 border-2 border-b-4 border-indigo-400 dark:border-indigo-600 border-b-indigo-600 dark:border-b-indigo-800 text-indigo-900 dark:text-indigo-100 shadow-sm';
              } else if (isChecked && isSelected) {
                cardStyle = choice.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-b-4 border-emerald-500 border-b-emerald-700 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-2 border-b-4 border-rose-500 border-b-rose-700 text-rose-950 dark:text-rose-100';
              }

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelect(choice.id)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3.5 text-left font-bold text-xs transition-all cursor-pointer ${cardStyle}`}
                >
                  <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliding Bottom Action Bar (Duolingo Style) */}
        {!isChecked ? (
          // Default unverified bottom bar
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
            <button
              type="button"
              disabled={!selectedChoiceId}
              onClick={handleCheck}
              className={`px-8 py-3 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer transition-all ${
                selectedChoiceId
                  ? 'duo-btn-green'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          </div>
        ) : isCorrect ? (
          // Iconic Bright Green Duolingo Success Footer
          <div className="p-5 sm:p-6 bg-emerald-100 dark:bg-emerald-950 border-t-2 border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-emerald-900 dark:text-emerald-100">
                  Nicely done!
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300 font-bold mt-0.5">
                  {selectedChoice?.explanation || 'Great job mastering this milestone.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="duo-btn-green px-8 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Continue (+50 XP)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Red Duolingo Try-Again Footer
          <div className="p-5 sm:p-6 bg-rose-100 dark:bg-rose-950 border-t-2 border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-rose-900 dark:text-rose-100">
                  Not quite right!
                </h4>
                <p className="text-xs text-rose-800/80 dark:text-rose-300 font-bold mt-0.5">
                  Review the question carefully and try another option.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white border-b-4 border-rose-800 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
