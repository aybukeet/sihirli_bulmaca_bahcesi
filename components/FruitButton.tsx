import React from 'react';

interface MagicCardProps {
  type: 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'cyan' | 'teal' | 'indigo' | 'rose' | 'red';
  label: string;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'large' | 'small';
}

const colors = {
  pink:   'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-100 text-pink-600 shadow-pink-200/50',
  purple: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-100 text-purple-600 shadow-purple-200/50',
  blue:   'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-100 text-blue-600 shadow-blue-200/50',
  green:  'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-100 text-emerald-600 shadow-emerald-200/50',
  yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-100 text-amber-600 shadow-yellow-200/50',
  orange: 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-100 text-orange-600 shadow-orange-200/50',
  cyan:   'bg-gradient-to-br from-cyan-100 to-cyan-200 border-cyan-100 text-cyan-600 shadow-cyan-200/50',
  teal:   'bg-gradient-to-br from-teal-100 to-teal-200 border-teal-100 text-teal-600 shadow-teal-200/50',
  indigo: 'bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-100 text-indigo-600 shadow-indigo-200/50',
  rose:   'bg-gradient-to-br from-rose-100 to-rose-200 border-rose-100 text-rose-600 shadow-rose-200/50',
  red:    'bg-gradient-to-br from-red-100 to-red-200 border-red-100 text-red-600 shadow-red-200/50',
};

export const FruitButton: React.FC<MagicCardProps> = ({ type, label, onClick, className = '', icon, variant = 'small' }) => {
  const colorClass = colors[type] || colors['pink'];

  return (
    <button
      onClick={onClick}
      className={`
        ${colorClass}
        ${className}
        relative flex flex-col items-center justify-center
        border-[6px] rounded-[2rem]
        transition-all duration-300 transform
        hover:scale-110 hover:-translate-y-2
        active:scale-95 active:translate-y-0
        shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)]
        overflow-hidden group
        ${variant === 'large' ? 'w-full h-56 md:h-72' : 'w-full aspect-square'}
      `}
    >
      {/* Glossy Overlay (Jelly Effect) */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/70 to-transparent rounded-t-[1.5rem] pointer-events-none"></div>
      
      {/* Magical Sparkles */}
      <div className="absolute top-4 right-4 animate-pulse text-2xl opacity-70">✨</div>
      <div className="absolute bottom-6 left-6 animate-pulse delay-100 text-xl opacity-60">✨</div>
      <div className="absolute top-1/2 left-4 w-2 h-2 bg-white rounded-full opacity-60 animate-ping"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className={`
            drop-shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110
            ${variant === 'large' ? 'text-[7rem]' : 'text-5xl md:text-6xl'}
        `}>
            {icon}
        </div>
        <span className={`
            font-['Fredoka'] font-bold tracking-wide text-center drop-shadow-sm bg-white/40 px-4 py-1 rounded-full backdrop-blur-sm
            ${variant === 'large' ? 'text-3xl' : 'text-lg md:text-xl'}
        `}>
            {label}
        </span>
      </div>
    </button>
  );
};