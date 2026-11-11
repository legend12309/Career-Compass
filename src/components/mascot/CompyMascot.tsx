import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';

export interface CompyMascotProps {
  mood?: 'happy' | 'celebrating' | 'waving' | 'thinking';
  speechText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
}

export const CompyMascot: React.FC<CompyMascotProps> = ({
  mood = 'happy',
  speechText,
  size = 'md',
  className = '',
  interactive = true,
}) => {
  const [clicked, setClicked] = useState(false);

  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    sounds.playPopSound();
    setClicked(true);
    setTimeout(() => setClicked(false), 550);
  };

  // Determine movement animation based on mood
  const getBodyAnimationClass = () => {
    if (clicked) return 'animate-compy-click';
    switch (mood) {
      case 'celebrating':
        return 'animate-compy-celebrating';
      case 'waving':
        return 'animate-compy-waving';
      case 'thinking':
        return 'animate-compy-thinking';
      case 'happy':
      default:
        return 'animate-compy-idle';
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Animated Compy Mascot Container */}
      <div
        onClick={handleClick}
        className={`relative ${sizeMap[size]} shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer ${getBodyAnimationClass()}`}
        title="Compy — Your Career Pathfinder Mascot (Click to interact!)"
        role="button"
        tabIndex={0}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 3D Base Drop Shadow */}
          <ellipse cx="50" cy="54" rx="42" ry="40" fill="#B45309" />

          {/* Compass Body Outer Ring (Warm Amber Gold) */}
          <ellipse cx="50" cy="50" rx="42" ry="40" fill="#F59E0B" />
          <ellipse cx="50" cy="48" rx="38" ry="36" fill="#FBBF24" />

          {/* Inner Compass Face */}
          <ellipse cx="50" cy="48" rx="33" ry="32" fill="#FEF3C7" />

          {/* Compass Dial Cardinal Dots (N, S, E, W) */}
          <circle cx="50" cy="20" r="2.5" fill="#D97706" />
          <circle cx="50" cy="76" r="2.5" fill="#D97706" />
          <circle cx="22" cy="48" r="2.5" fill="#D97706" />
          <circle cx="78" cy="48" r="2.5" fill="#D97706" />

          {/* Animated Eyes with Expressions & Organic Blinking */}
          {mood === 'celebrating' ? (
            // Excited Star Eyes for celebratory milestones
            <g className="animate-compy-sparkle">
              <text x="36" y="47" fontSize="13" textAnchor="middle" fill="#78350F" fontWeight="900">★</text>
              <text x="64" y="47" fontSize="13" textAnchor="middle" fill="#78350F" fontWeight="900">★</text>
            </g>
          ) : mood === 'thinking' ? (
            // Inquisitive Eyes looking up at career coordinates
            <g>
              <circle cx="38" cy="40" r="5" fill="#78350F" />
              <circle cx="40" cy="38" r="1.8" fill="#FFFFFF" />
              <circle cx="62" cy="40" r="5" fill="#78350F" />
              <circle cx="64" cy="38" r="1.8" fill="#FFFFFF" />
              {/* Questioning curved eyebrow */}
              <path d="M57 32 Q62 29 67 33" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            // Big Friendly Happy Eyes with Natural Blinking Moments
            <g className="animate-compy-blink">
              <circle cx="38" cy="44" r="5.5" fill="#78350F" />
              <circle cx="40" cy="42" r="2" fill="#FFFFFF" />
              <circle cx="62" cy="44" r="5.5" fill="#78350F" />
              <circle cx="64" cy="42" r="2" fill="#FFFFFF" />
            </g>
          )}

          {/* Cheerful Pink Blushing Cheeks */}
          <ellipse cx="27" cy="51" rx="4.5" ry="3" fill="#F472B6" opacity="0.8" />
          <ellipse cx="73" cy="51" rx="4.5" ry="3" fill="#F472B6" opacity="0.8" />

          {/* Expressive Mouth */}
          {mood === 'celebrating' ? (
            <path
              d="M39 53 Q50 67 61 53"
              stroke="#78350F"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="#BE185D"
            />
          ) : mood === 'thinking' ? (
            <path
              d="M44 55 Q50 53 56 55"
              stroke="#78350F"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M42 53 Q50 61 58 53"
              stroke="#78350F"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Dynamic Magnetic Needle Cap (Wobbles like a real compass!) */}
          <g className={mood === 'thinking' ? 'animate-compy-needle' : 'animate-compy-needle'}>
            {/* North Red Pointer */}
            <polygon points="50,6 44,22 56,22" fill="#EF4444" />
            {/* South Blue Pointer */}
            <polygon points="50,22 45,28 55,28" fill="#3B82F6" />
            {/* Brass Center Pivot */}
            <circle cx="50" cy="22" r="3.5" fill="#FCD34D" stroke="#78350F" strokeWidth="1.2" />
          </g>

          {/* Animated Waving Arm Movement */}
          {mood === 'waving' && (
            <g className="animate-compy-arm">
              <path
                d="M10 40 Q4 28 8 18"
                stroke="#F59E0B"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="18" r="3.5" fill="#FBBF24" />
            </g>
          )}

          {/* Celebratory Twinkling Sparkles */}
          {mood === 'celebrating' && (
            <>
              <g className="animate-compy-sparkle">
                <text x="12" y="24" fontSize="13" fill="#F59E0B">✨</text>
                <text x="82" y="26" fontSize="13" fill="#EC4899">✨</text>
              </g>
            </>
          )}
        </svg>
      </div>

      {/* Spring Animated Speech Bubble */}
      {speechText && (
        <div className="animate-compy-bubble relative bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-950 px-3.5 py-2.5 rounded-2xl shadow-sm text-xs font-bold text-slate-800 dark:text-slate-100 max-w-xs">
          {/* Triangular Pointer Arrow */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-8 border-r-slate-200 dark:border-r-slate-800 border-b-6 border-b-transparent" />
          <span>{speechText}</span>
        </div>
      )}
    </div>
  );
};
