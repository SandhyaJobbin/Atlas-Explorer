import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';

interface InfoCardProps {
  state: StateEntry;
  onClose?: () => void;
  accentColor?: string;
  theme?: 'water' | 'desert' | 'forest' | 'generic';
}

export default function InfoCard({ state, accentColor, theme = 'generic' }: InfoCardProps) {
  const isCA = state.country === 'CA';
  const defaultAccent = isCA ? '#C41E3A' : '#232F3E';
  const headerBg = accentColor || defaultAccent;

  // Theme-specific icons/styles
  const themeStyles = {
    water: { icon: '💡', deco: '/assets/illustrations/anchor.svg', pillBg: 'bg-cyan-50', pillBorder: 'border-cyan-100', text: 'text-cyan-900', label: 'text-cyan-700', nextText: 'Syncing Next Sector...' },
    desert: { icon: '💡', deco: '/assets/illustrations/cactus.svg', pillBg: 'bg-orange-50', pillBorder: 'border-orange-100', text: 'text-orange-900', label: 'text-orange-700', nextText: 'Recalibrating Radar...' },
    forest: { icon: '🍃', deco: '/assets/illustrations/pine-tree.svg', pillBg: 'bg-emerald-50', pillBorder: 'border-emerald-100', text: 'text-emerald-900', label: 'text-emerald-700', nextText: 'Hub Expansion Success...' },
    generic: { icon: '💡', deco: '', pillBg: 'bg-gray-50', pillBorder: 'border-gray-100', text: 'text-gray-900', label: 'text-gray-700', nextText: 'Processing...' },
  }[theme];

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 paper-texture pointer-events-auto">
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
          <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {state.timezone}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Capital</p>
            <p className="font-bold text-gray-800">{state.capital}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Country</p>
            <p className="font-bold text-gray-800">{state.country === 'CA' ? 'Canada (CA)' : 'United States (US)'}</p>
          </div>
        </div>
        
        {state.specialties && state.specialties.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {state.specialties.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
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
              <p className={`text-[9px] font-black uppercase tracking-widest ${themeStyles.label}`}>
                {theme === 'forest' ? 'Sector Insight' : 'Did you know?'}
              </p>
            </div>
            <p className={`text-xs ${themeStyles.text} leading-relaxed font-medium`}>
              {state.trivia[Math.floor(Math.random() * state.trivia.length)]}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: headerBg }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: headerBg }}>
            {themeStyles.nextText}
          </span>
        </div>
      </div>
    </div>
  );
}
