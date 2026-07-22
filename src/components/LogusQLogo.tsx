import React from 'react';

// Import generated brand image assets
import heroLogoImg from '../assets/images/logusq_logo_hero_1784728121443.jpg';
import iconLogoImg from '../assets/images/logusq_logo_icon_1784728137183.jpg';

interface LogusQLogoProps {
  variant?: 'full' | 'icon' | 'hero' | 'print' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
  className?: string;
}

export function LogusQLogoImage({ 
  type = 'hero', 
  className = 'h-12 w-auto object-contain' 
}: { 
  type?: 'hero' | 'icon'; 
  className?: string; 
}) {
  const src = type === 'icon' ? iconLogoImg : heroLogoImg;
  return (
    <img 
      src={src} 
      alt="LogusQ Inteligência Logística" 
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}

export default function LogusQLogo({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  showTagline = false,
  className = ''
}: LogusQLogoProps) {
  // Size mapping
  const sizeClasses = {
    xs: { text: 'text-base', icon: 'w-5 h-5', container: 'gap-1.5' },
    sm: { text: 'text-lg', icon: 'w-6 h-6', container: 'gap-2' },
    md: { text: 'text-2xl', icon: 'w-8 h-8', container: 'gap-2.5' },
    lg: { text: 'text-3xl', icon: 'w-10 h-10', container: 'gap-3' },
    xl: { text: 'text-4xl', icon: 'w-12 h-12', container: 'gap-3.5' },
    hero: { text: 'text-5xl md:text-6xl', icon: 'w-16 h-16', container: 'gap-4' }
  }[size];

  // 1. Hero Image Variant (Full 3D Rendered Banner Logo)
  if (variant === 'hero') {
    return (
      <div className={`relative flex flex-col items-center text-center ${className}`}>
        <div className="relative group overflow-hidden rounded-2xl shadow-2xl border border-slate-700/50 bg-slate-900/80 p-2 backdrop-blur-md">
          <img 
            src={heroLogoImg} 
            alt="LogusQ - Inteligência em Roteirização" 
            referrerPolicy="no-referrer"
            className="w-full max-w-2xl h-auto rounded-xl object-contain shadow-inner transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent rounded-xl pointer-events-none" />
        </div>
        {showTagline && (
          <p className="mt-3 text-xs md:text-sm font-semibold tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Roteirização &amp; Inteligência de Entregas
          </p>
        )}
      </div>
    );
  }

  // 2. Badge Variant (Pill container for sidebars & navbars)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-lg shadow-purple-950/20 backdrop-blur-md ${className}`}>
        {/* Stylized Vector Q Icon */}
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-900 p-1 shadow-md shadow-purple-500/30">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
            {/* Q Outer Circle */}
            <path d="M50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 C60.5 90 70.1 85.9 77.2 79.2 L67.8 69.8 C63.2 73.7 57.1 76 50 76 C35.6 76 24 64.4 24 50 C24 35.6 35.6 24 50 24 C64.4 24 76 35.6 76 50 C76 55.8 74.1 61.1 70.9 65.4 L80.8 75.3 C86.5 68.4 90 59.6 90 50 C90 27.9 72.1 10 50 10 Z" />
            {/* Upward Arrow Tail inside Q */}
            <polygon points="50,28 64,52 54,52 54,74 46,74 46,52 36,52" className="fill-cyan-300" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-lg tracking-wider text-white font-sans">
            LOGUS<span className="text-purple-400">Q</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-cyan-400 uppercase">
            INTELLIGENCE
          </span>
        </div>
      </div>
    );
  }

  // 3. Icon Only Variant
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center rounded-xl bg-slate-900 border border-purple-500/40 p-1.5 shadow-lg shadow-purple-900/30 ${sizeClasses.icon} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
          <defs>
            <linearGradient id="qGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="arrowGradIcon" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* Stylized 3D Q Ring */}
          <path fill="url(#qGradIcon)" d="M50 8 C26.8 8 8 26.8 8 50 C8 73.2 26.8 92 50 92 C60.9 92 70.8 87.8 78.2 80.9 L68.5 71.2 C63.4 75.5 57 78 50 78 C34.5 78 22 65.5 22 50 C22 34.5 34.5 22 50 22 C65.5 22 78 34.5 78 50 C78 56.1 76 61.7 72.6 66.2 L82.5 76.1 C88.5 69.1 92 60 92 50 C92 26.8 73.2 8 50 8 Z" />
          {/* Integrated Forward-Up Arrow */}
          <polygon fill="url(#arrowGradIcon)" points="50,26 66,50 55,50 55,72 45,72 45,50 34,50" />
        </svg>
      </div>
    );
  }

  // 4. Full Vector Logo (LOGUS + stylized purple Q with upward arrow)
  const isDark = theme === 'dark' || theme === 'auto';

  return (
    <div className={`inline-flex items-center ${sizeClasses.container} select-none ${className}`}>
      {/* Visual Logo Mark */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className={`${sizeClasses.icon} filter drop-shadow-md`}>
          <defs>
            <linearGradient id="logusqPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            <linearGradient id="logusqCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="silverChrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          
          {/* Stylized Q Outer Body with integrated 3D bevels */}
          <path 
            fill="url(#logusqPurple)" 
            d="M50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 C60.5 90 70.1 85.9 77.2 79.2 L67.8 69.8 C63.2 73.7 57.1 76 50 76 C35.6 76 24 64.4 24 50 C24 35.6 35.6 24 50 24 C64.4 24 76 35.6 76 50 C76 55.8 74.1 61.1 70.9 65.4 L80.8 75.3 C86.5 68.4 90 59.6 90 50 C90 27.9 72.1 10 50 10 Z" 
          />
          
          {/* Internal Glowing Route Arrow (Upward/Forward Performance) */}
          <polygon fill="url(#logusqCyan)" points="50,26 66,50 55,50 55,74 45,74 45,50 34,50" />
          
          {/* GPS Route Pin Circle Accent at Arrow Apex */}
          <circle cx="50" cy="22" r="4" fill="#67e8f9" />
        </svg>
      </div>

      {/* Typography: LOGUS + Purple Q */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black tracking-tight ${sizeClasses.text} font-sans flex items-center`}>
          <span className={isDark ? "text-slate-100 drop-shadow-sm" : "text-slate-900 font-extrabold"}>
            LOGUS
          </span>
          <span className="bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent font-black ml-0.5 filter drop-shadow-sm">
            Q
          </span>
        </div>
        
        {showTagline && (
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-cyan-400 uppercase mt-0.5">
            Inteligência Logística
          </span>
        )}
      </div>
    </div>
  );
}
