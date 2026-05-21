import type { ReactNode } from 'react';
import { publicAsset } from '@/lib/assets';

interface AppLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'training' | 'game' | 'results';
}

export default function AppLayout({ children, variant = 'default' }: AppLayoutProps) {
  const topoOpacity = variant === 'game' ? 'opacity-[0.02]' : 'opacity-[0.03]';

  return (
    <div className={`h-screen flex flex-col bg-atlas-warm relative transition-colors duration-700 overflow-hidden font-sans text-atlas-ink`}>
      
      {/* Global Topographic Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none ${topoOpacity} z-0`}
        style={{ 
          backgroundImage: `url("${publicAsset('/assets/patterns/topo-pattern.png')}")`,
          backgroundSize: '500px',
          backgroundRepeat: 'repeat'
        }} 
      />

      {/* Global Grain/Noise Overlay for Premium Feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] z-0 mix-blend-overlay"
        style={{ 
          backgroundImage: `url("${publicAsset('/assets/patterns/paper-grain.png')}")`,
          backgroundSize: '300px'
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-20 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
