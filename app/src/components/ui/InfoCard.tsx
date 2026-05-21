import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';

interface InfoCardProps {
  state: StateEntry;
  onClose?: () => void;
  accentColor?: string;
  theme?: 'water' | 'desert' | 'forest' | 'generic';
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function InfoCard({ state, accentColor, theme = 'generic' }: InfoCardProps) {
  const isCA = state.country === 'CA';
  const defaultAccent = isCA ? 'var(--atlas-error)' : 'var(--atlas-ink)';
  const headerBg = accentColor || defaultAccent;

  // Theme-specific icons/styles
  const themeStyles = {
    water: { icon: '💡', deco: '/assets/illustrations/anchor.svg', pillBg: 'bg-atlas-warm', pillBorder: 'border-atlas-border', text: 'text-atlas-ink', label: 'text-atlas-muted', nextText: 'Preparing Next Region...' },
    desert: { icon: '💡', deco: '/assets/illustrations/cactus.svg', pillBg: 'bg-atlas-warm', pillBorder: 'border-atlas-border', text: 'text-atlas-ink', label: 'text-atlas-muted', nextText: 'Recalibrating Radar...' },
    forest: { icon: '🍃', deco: '/assets/illustrations/pine-tree.svg', pillBg: 'bg-atlas-warm', pillBorder: 'border-atlas-border', text: 'text-atlas-ink', label: 'text-atlas-muted', nextText: 'Hub Expansion Success...' },
    generic: { icon: '💡', deco: '', pillBg: 'bg-atlas-warm', pillBorder: 'border-atlas-border', text: 'text-atlas-ink', label: 'text-atlas-muted', nextText: 'Processing...' },
  }[theme];
  const trivia = state.trivia?.length ? state.trivia[hashString(`${state.code}:${theme}`) % state.trivia.length] : null;

  return (
    <div className="w-full max-w-sm bg-atlas-card rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 paper-texture pointer-events-auto border border-atlas-border font-display">
      <div className="p-6 text-white relative overflow-hidden" style={{ backgroundColor: headerBg }}>
        {themeStyles.deco && (
          <img 
            src={publicAsset(themeStyles.deco)} 
            className="absolute top-[-10px] right-[-10px] w-24 h-24 opacity-10 pointer-events-none grayscale brightness-200" 
            alt="" 
          />
        )}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-black">{state.code}</span>
              <span className="text-xl">{isCA ? '🇨🇦' : '🇺🇸'}</span>
            </div>
            <h3 className="text-xl font-bold font-display">{state.name}</h3>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            {state.timezone}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4 font-display">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-atlas-muted">Capital</p>
            <p className="font-bold text-atlas-ink">{state.capital}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-atlas-muted">Country</p>
            <p className="font-bold text-atlas-ink">{state.country === 'CA' ? 'Canada (CA)' : 'United States (US)'}</p>
          </div>
        </div>
        
        {state.specialties && state.specialties.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-atlas-muted mb-2">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {state.specialties.map(s => (
                <span key={s} className="px-2.5 py-1 rounded-md bg-atlas-warm text-atlas-ink text-xs font-bold border border-atlas-border">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {state.trivia && state.trivia.length > 0 && (
          <div className={`${themeStyles.pillBg} border ${themeStyles.pillBorder} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{themeStyles.icon}</span>
              <p className={`text-xs font-black uppercase tracking-widest ${themeStyles.label}`}>
                {theme === 'forest' ? 'Region Insight' : 'Did you know?'}
              </p>
            </div>
            <p className={`text-xs ${themeStyles.text} leading-relaxed font-medium font-sans`}>
              {trivia}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: headerBg }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: headerBg }}>
            {themeStyles.nextText}
          </span>
        </div>
      </div>
    </div>
  );
}
