import React from 'react';

interface StampBadgeProps {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export default function StampBadge({ label, type, className = '' }: StampBadgeProps) {
  const colors = {
    success: 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    error: 'border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    warning: 'border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    info: 'border-cyan-500 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  };

  return (
    <div
      className={`
        relative inline-block px-6 py-2 border-4 rounded-lg font-black uppercase tracking-[0.2em] text-2xl
        rotate-[-12deg] transform-gpu transition-all duration-300
        animate-stamp-in
        ${colors[type]}
        ${className}
      `}
    >
      {/* Texture overlay for "ink" effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] mix-blend-overlay" />
      
      <span className="relative z-10">{label}</span>
      
      {/* Decorative dots/corners */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-current opacity-30" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-current opacity-30" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-current opacity-30" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-current opacity-30" />
    </div>
  );
}
