import type { GameState } from '@/types';
import { GAME_DEFINITIONS } from '@/lib/session';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_ICONS: Record<string, string> = { crack: '01', pin: '02', sorter: '03' };

const START_COPY: Record<string, string> = {
  crack: 'Begin descent',
  pin:   'Open the map',
  sorter:'Start stacking',
};

const INTRO_COPY: Record<string, string> = {
  crack:  'Catch each falling location tag, type the right code, and keep your streak alive.',
  pin:    'Scan the map, hit the glowing target, and clear each drop before the timer burns out.',
  sorter: 'Drag city cards into the right home column and combo through the board.',
};

const DISPLAY_LABELS: Record<string, string> = {
  crack:  'Code Drop',
  pin:    'Pin Rush',
  sorter: 'City Stack',
};

const PIN_POSITIONS = [
  { top: '65%', left: '35%' },
  { top: '45%', left: '20%' },
  { top: '35%', left: '55%' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface GameIntroProps {
  gameIndex: number;
  game: GameState;
  clearedCount: number;
  totalGames: number;
  onStart: (isRetry: boolean) => void;
}

export default function GameIntro({ gameIndex, game, clearedCount, totalGames, onStart }: GameIntroProps) {
  const definition = GAME_DEFINITIONS[gameIndex];
  const isRetry = game.retryAvailable;
  const label   = DISPLAY_LABELS[definition.key] ?? definition.key;
  const icon    = GAME_ICONS[definition.key]    ?? '??';
  const startLabel = isRetry
    ? 'Run it back'
    : (START_COPY[definition.key] ?? 'Play level');

  const bestLabel =
    game.attempts.length === 0
      ? 'No attempts yet'
      : `${Math.round(Math.max(...game.attempts.map((a) => a.ratio)) * 100)}%`;

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#2D3B2F]">
      
      {/* ── Map panel ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 bg-black/40 flex items-center justify-center overflow-hidden min-h-48 lg:min-h-0 border-r border-white/10">
        
        {/* Background Journal Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08]" 
          style={{ backgroundImage: 'url("/assets/patterns/journal-texture.png")', backgroundSize: '400px' }} 
        />
        
        {/* Terrain Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.05]" 
          style={{ backgroundImage: 'url("/assets/patterns/dots-pattern.png")', backgroundSize: '100px' }} 
        />

        <img
          src="/maps/north-america.svg"
          alt=""
          className="w-full h-full object-contain opacity-30 max-w-xl p-12 drop-shadow-[0_0_40px_rgba(0,168,162,0.15)]"
        />

        {/* Route dashed line */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M20 65 C35 34, 52 28, 74 48"
            fill="none"
            stroke="#10B981"
            strokeWidth="0.8"
            strokeDasharray="4 3"
            strokeLinecap="round"
            className="opacity-40 animate-dash-move"
          />
        </svg>

        {/* Numbered pins */}
        {PIN_POSITIONS.slice(0, totalGames).map((pos, index) => (
          <div
            key={index}
            className={`absolute w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
              index === gameIndex
                ? 'bg-[#F59E0B] border-[#F59E0B] text-[#2D3B2F] scale-125 shadow-[0_0_30px_rgba(245,158,11,0.5)] rotate-0'
                : index < gameIndex
                ? 'bg-[#10B981] border-[#10B981] text-[#2D3B2F] rotate-12'
                : 'bg-white/10 border-white/20 text-white/40'
            }`}
            style={{ top: pos.top, left: pos.left }}
          >
            {index + 1}
          </div>
        ))}

        {/* Caption */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className="text-white/40 text-[9px] uppercase tracking-widest font-black mb-1">{isRetry ? 'Recalculating' : 'Next Target'}</div>
          <div className="text-[#F59E0B] font-black text-sm uppercase tracking-tight">{label}</div>
        </div>
      </div>

      {/* ── Mission brief panel ───────────────────────────────────────────── */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col justify-center p-12 gap-8 relative overflow-hidden">
        
        {/* Subtle dot pattern on white */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'var(--geo-dot-pattern)', backgroundSize: '24px 24px' }} />

        {/* Kicker */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex flex-col">
            <span className="text-[#2D3B2F]/40 text-[9px] font-black uppercase tracking-[0.3em] mb-1">
              Sector Identification
            </span>
            <span className="text-[#2D3B2F] text-xs font-black">
              PHASE {gameIndex + 1} // 0{totalGames}
            </span>
          </div>
          <div className="ml-auto w-12 h-12 bg-[#2D3B2F] text-white flex items-center justify-center rounded-2xl shadow-xl font-mono text-xl font-black">
            {icon}
          </div>
        </div>

        {/* Title + description */}
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-[#2D3B2F] leading-tight tracking-tighter">
            {label}
            {isRetry && <span className="text-[#F59E0B] ml-2 block text-2xl">Remix Protocol</span>}
          </h1>
          <p className="text-[#2D3B2F]/60 mt-4 text-base leading-relaxed font-medium">
            {INTRO_COPY[definition.key] ?? ''}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {[
            { label: 'Completion',  value: `${clearedCount}/${totalGames}`, accent: '#10B981' },
            { label: 'Best Ratio',  value: bestLabel, accent: '#06B6D4' },
          ].map(({ label: l, value, accent }) => (
            <div key={l} className="bg-white border-2 border-[#2D3B2F]/5 rounded-2xl p-5 shadow-sm">
              <div className="text-[#2D3B2F]/40 text-[9px] uppercase font-black tracking-widest mb-2">{l}</div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <div className="text-[#2D3B2F] font-black text-xl tracking-tight">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="mt-4 relative z-10">
          <button
            onClick={() => onStart(isRetry)}
            className="w-full bg-[#F59E0B] hover:bg-[#FFB12B] text-[#2D3B2F] font-black py-5 rounded-2xl text-xl transition-all shadow-[0_10px_0_#D97706] hover:translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_#D97706] uppercase tracking-widest"
          >
            {startLabel}
          </button>
          <div className="mt-6 flex justify-center gap-1.5">
             {[...Array(3)].map((_, i) => (
               <div key={i} className={`w-2 h-2 rounded-full ${i < game.stars ? 'bg-[#F59E0B]' : 'bg-[#2D3B2F]/10'}`} />
             ))}
          </div>
        </div>

        <p className="text-[#2D3B2F]/30 text-[10px] font-bold text-center uppercase tracking-widest relative z-10">
          Unlimited retries · Stars based on precision
        </p>
      </div>

      <style>{`
        @keyframes dash-move {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash-move {
          stroke-dasharray: 4 3;
          animation: dash-move 5s linear infinite;
        }
      `}</style>
    </main>
  );
}

