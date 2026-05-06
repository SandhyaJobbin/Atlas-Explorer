import { useState, useEffect } from 'react';
import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';

interface IntelVaultProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntelVault({ isOpen, onClose }: IntelVaultProps) {
  const [states, setStates] = useState<StateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState<'US' | 'CA' | null>('US');

  useEffect(() => {
    fetch(publicAsset('/data/states.json'))
      .then((r) => r.json())
      .then((data: StateEntry[]) => {
        setStates(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const usStates = states.filter((s) => s.country === 'US');
  const caStates = states.filter((s) => s.country === 'CA');

  if (!isOpen) return null;

  return (
    <aside 
      className={`fixed lg:relative inset-y-0 right-0 z-50 w-full sm:w-80 lg:w-72 bg-[#121a14]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right-full lg:slide-in-from-right-0`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗄️</span>
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-widest">Intel Vault</h2>
            <p className="text-[9px] text-[#00A8A2] font-bold uppercase tracking-tighter">Declassified Reference</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <span className="text-xl">×</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Decrypting...</span>
          </div>
        ) : (
          <>
            {/* US Section */}
            <CountrySection 
              title="United States" 
              flag="us" 
              count={usStates.length} 
              isExpanded={expandedCountry === 'US'} 
              onToggle={() => setExpandedCountry(expandedCountry === 'US' ? null : 'US')}
            >
              <div className="grid gap-3">
                {usStates.map((s) => (
                  <IntelCard key={s.code} state={s} />
                ))}
              </div>
            </CountrySection>

            {/* CA Section */}
            <CountrySection 
              title="Canada" 
              flag="ca" 
              count={caStates.length} 
              isExpanded={expandedCountry === 'CA'} 
              onToggle={() => setExpandedCountry(expandedCountry === 'CA' ? null : 'CA')}
            >
              <div className="grid gap-3">
                {caStates.map((s) => (
                  <IntelCard key={s.code} state={s} />
                ))}
              </div>
            </CountrySection>
          </>
        )}
      </div>

      {/* Footer deco */}
      <div className="p-3 bg-black/40 border-t border-white/5 text-center">
        <span className="text-[8px] font-mono text-white/20 tracking-[0.3em] uppercase">Sector Intelligence // v4.6</span>
      </div>
    </aside>
  );
}

function CountrySection({ 
  title, 
  flag, 
  count, 
  children, 
  isExpanded, 
  onToggle 
}: { 
  title: string; 
  flag: string; 
  count: number; 
  children: React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="space-y-3">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <img 
            src={`https://flagcdn.com/24x18/${flag}.png`} 
            alt={title} 
            className="rounded-sm shadow-sm"
          />
          <h3 className="text-white/60 font-black text-[11px] uppercase tracking-wider group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/20">{count} files</span>
          <span className={`text-[10px] text-white/20 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

function IntelCard({ state }: { state: StateEntry }) {
  return (
    <div className="group relative bg-[#F5F0E8] p-3 rounded-xl border border-white/70 paper-texture shadow-lg hover:translate-x-1 transition-transform cursor-default overflow-hidden">
      {/* Top Secret Stamp (Watermark) */}
      <div className="absolute top-1 right-1 opacity-[0.05] pointer-events-none -rotate-12 select-none group-hover:opacity-[0.08] transition-opacity">
        <span className="text-[24px] font-black border-4 border-red-900 text-red-900 px-1 uppercase leading-none">INTEL</span>
      </div>

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-[#2D3B2F]/40 uppercase tracking-tighter leading-none mb-1">State Code: {state.code}</span>
          <h4 className="text-[#232F3E] font-black text-sm leading-tight tracking-tight">{state.name}</h4>
        </div>
        <span className="text-[10px] font-black text-[#00A8A2] bg-[#00A8A2]/10 px-1.5 py-0.5 rounded uppercase">
          {state.timezone}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[9px] relative z-10">
        <div>
          <span className="text-[#2D3B2F]/40 font-bold uppercase block mb-0.5">Capital</span>
          <span className="text-[#2D3B2F] font-bold">{state.capital}</span>
        </div>
        <div>
          <span className="text-[#2D3B2F]/40 font-bold uppercase block mb-0.5">Country</span>
          <span className="text-[#2D3B2F] font-bold">{state.country === 'CA' ? 'Canada (CA)' : 'United States (US)'}</span>
        </div>
      </div>
      
      {/* File staple deco */}
      <div className="absolute top-0 left-4 w-4 h-1.5 bg-gray-400/20 rounded-b-sm border-x border-b border-gray-400/30" />
    </div>
  );
}
