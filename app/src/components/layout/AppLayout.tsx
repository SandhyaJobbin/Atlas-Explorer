import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'training' | 'game' | 'results';
}

export default function AppLayout({ children, variant = 'default' }: AppLayoutProps) {
  const isGameOrResults = variant === 'game' || variant === 'results';
  
  return (
    <div className={`h-screen flex flex-col bg-[#2D3B2F] relative transition-colors duration-700 overflow-hidden`}>
      
      {/* Global Topographic Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
        style={{ 
          backgroundImage: 'var(--geo-topo-pattern)', 
          backgroundSize: '500px',
          backgroundRepeat: 'repeat'
        }} 
      />

      {/* Global Grain/Noise Overlay for Premium Feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] z-0 mix-blend-overlay"
        style={{ 
          backgroundImage: 'url("/assets/patterns/journal-texture.png")',
          backgroundSize: '300px'
        }}
      />
      
      {/* Scanline Effect for Tech/Game Feel */}
      {isGameOrResults && (
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      )}
      
      {/* Content wrapper */}
      <div className="relative z-20 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
