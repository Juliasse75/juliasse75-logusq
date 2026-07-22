import React from 'react';
import clean3dLogoImg from '../assets/images/logusq_logo_3d_clean_1784729238754.jpg';
import heroLogoImg from '../assets/images/logusq_logo_hero_1784728121443.jpg';

interface LogusQLogoProps {
  variant?: 'full' | 'icon' | 'hero' | 'badge' | 'image';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showTagline?: boolean;
  className?: string;
}

export default function LogusQLogo({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = ''
}: LogusQLogoProps) {
  // Size classes mapping
  const sizeConfig = {
    xs: { text: 'text-sm', qSize: 'w-4 h-4', gap: 'gap-1', imgH: 'h-6' },
    sm: { text: 'text-lg', qSize: 'w-5 h-5', gap: 'gap-1.5', imgH: 'h-8' },
    md: { text: 'text-2xl', qSize: 'w-7 h-7', gap: 'gap-2', imgH: 'h-10' },
    lg: { text: 'text-3xl', qSize: 'w-9 h-9', gap: 'gap-2.5', imgH: 'h-14' },
    xl: { text: 'text-4xl md:text-5xl', qSize: 'w-12 h-12', gap: 'gap-3', imgH: 'h-20' },
    hero: { text: 'text-5xl md:text-7xl', qSize: 'w-16 h-16', gap: 'gap-4', imgH: 'h-28' },
  }[size];

  // 1. Image Variant (3D Rendered Isolated Image from Image 2)
  if (variant === 'image') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <img 
          src={clean3dLogoImg} 
          alt="LOGUSQ" 
          referrerPolicy="no-referrer"
          className={`${sizeConfig.imgH} w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(168,85,247,0.35)] transition-transform duration-300 hover:scale-105`}
        />
        {showTagline && (
          <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-cyan-400 uppercase mt-1">
            INTELIGÊNCIA LOGÍSTICA
          </span>
        )}
      </div>
    );
  }

  // 2. Hero Variant (Showcase Banner for Landing & Login)
  if (variant === 'hero') {
    return (
      <div className={`relative flex flex-col items-center text-center select-none ${className}`}>
        <div className="relative group p-2">
          {/* Subtle Glow behind 3D render */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <img 
            src={heroLogoImg} 
            alt="LOGUSQ Inteligência Logística" 
            referrerPolicy="no-referrer"
            className="relative max-w-xl md:max-w-2xl w-full h-auto rounded-2xl object-contain border border-slate-700/50 shadow-[0_20px_50px_rgba(15,23,42,0.9)] bg-slate-950/80 p-2 backdrop-blur-xl"
          />
        </div>
        {showTagline && (
          <p className="mt-4 text-xs md:text-sm font-extrabold tracking-[0.3em] uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            Roteirização Scientífica &amp; Inteligência de Entregas
          </p>
        )}
      </div>
    );
  }

  // 3. Icon Only Variant (The 3D Neon Purple Q with Diagonal Arrow)
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeConfig.qSize} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">
          <defs>
            <linearGradient id="qGradNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="30%" stopColor="#c084fc" />
              <stop offset="70%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
            <linearGradient id="arrowGradNeon" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Q Outer Ring */}
          <path 
            fill="url(#qGradNeon)" 
            d="M50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 C60.8 90 70.6 85.7 77.8 78.8 L68.2 69.2 C63.6 73.5 57.2 76 50 76 C35.6 76 24 64.4 24 50 C24 35.6 35.6 24 50 24 C64.4 24 76 35.6 76 50 C76 56 73.9 61.5 70.4 65.9 L80.3 75.8 C86.3 68.8 90 59.8 90 50 C90 27.9 72.1 10 50 10 Z" 
          />
          {/* Diagonal Arrow Cutting Upward-Right Through the Q */}
          <polygon 
            fill="url(#arrowGradNeon)" 
            points="32,68 76,24 82,30 84,16 70,18 76,24 32,68" 
          />
        </svg>
      </div>
    );
  }

  // 4. Badge Variant (Pill container for navigation bars & headers)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-lg shadow-purple-950/30 backdrop-blur-md select-none ${className}`}>
        {/* Q 3D Icon */}
        <div className="w-6 h-6 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
            <defs>
              <linearGradient id="qGradBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            <path fill="url(#qGradBadge)" d="M50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 C60.8 90 70.6 85.7 77.8 78.8 L68.2 69.2 C63.6 73.5 57.2 76 50 76 C35.6 76 24 64.4 24 50 C24 35.6 35.6 24 50 24 C64.4 24 76 35.6 76 50 C76 56 73.9 61.5 70.4 65.9 L80.3 75.8 C86.3 68.8 90 59.8 90 50 C90 27.9 72.1 10 50 10 Z" />
            <polygon fill="#ffffff" points="32,68 76,24 82,30 84,16 70,18 76,24 32,68" />
          </svg>
        </div>
        {/* LOGUS + Q */}
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-base tracking-wider text-slate-100 font-sans">
            LOGUS<span className="text-purple-400 font-black">Q</span>
          </span>
          <span className="text-[8px] font-bold tracking-widest text-cyan-400 uppercase">
            INTELLIGENCE
          </span>
        </div>
      </div>
    );
  }

  // 5. Default Full Typography Logo (3D Chrome "LOGUS" + 3D Neon Purple "Q" with Diagonal Arrow)
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className={`inline-flex items-center ${sizeConfig.gap} font-sans font-black tracking-tight leading-none`}>
        {/* 3D Metallic Chrome "LOGUS" */}
        <span 
          className={`${sizeConfig.text} font-black tracking-tight uppercase bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
          style={{
            WebkitTextStroke: '0.5px rgba(255,255,255,0.3)',
          }}
        >
          LOGUS
        </span>

        {/* 3D Neon Purple Letter "Q" with integrated diagonal arrow */}
        <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeConfig.qSize}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]">
            <defs>
              <linearGradient id="qPurpleMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0abfc" />
                <stop offset="40%" stopColor="#c084fc" />
                <stop offset="80%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
              <linearGradient id="qArrowMain" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#e0e7ff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {/* Main 3D Q Ring */}
            <path 
              fill="url(#qPurpleMain)" 
              d="M50 8 C26.8 8 8 26.8 8 50 C8 73.2 26.8 92 50 92 C60.9 92 70.8 87.8 78.2 80.9 L68.5 71.2 C63.4 75.5 57 78 50 78 C34.5 78 22 65.5 22 50 C22 34.5 34.5 22 50 22 C65.5 22 78 34.5 78 50 C78 56.1 76 61.7 72.6 66.2 L82.5 76.1 C88.5 69.1 92 60 92 50 C92 26.8 73.2 8 50 8 Z" 
            />
            {/* 3D Diagonal Upward Arrow */}
            <polygon 
              fill="url(#qArrowMain)" 
              points="30,70 76,24 83,31 85,15 69,17 76,24 30,70" 
            />
          </svg>
        </div>
      </div>

      {showTagline && (
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-cyan-400 uppercase mt-1.5 font-sans">
          INTELIGÊNCIA LOGÍSTICA
        </span>
      )}
    </div>
  );
}

