import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import AppLayout from '@/components/layout/AppLayout';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { BADGE_DEFS } from '@/lib/badges';
import { publicAsset } from '@/lib/assets';
import { GAME_DEFINITIONS } from '@/lib/session';

// ─── Badge icon emojis (landing preview) ─────────────────────────────────────

const BADGE_ICONS: Record<string, string> = {
  'first-blood':    '🚀',
  'perfect-agent':  '💯',
  'hot-streak':     '🔥',
  'globe-trotter':  '🌍',
  'diamond-agent':  '💎',
  'star-collector': '⭐',
  'never-quit':     '🏅',
  'speed-run':      '⚡',
};

const BADGE_DESCS: Record<string, string> = {
  'first-blood':    'Pass on the first try',
  'perfect-agent':  'Score 100% in any level',
  'hot-streak':     'Chain 3 correct answers',
  'globe-trotter':  `Pass all ${GAME_DEFINITIONS.length} games`,
  'diamond-agent':  `Pass all ${GAME_DEFINITIONS.length} on the first try`,
  'star-collector': `Collect all ${GAME_DEFINITIONS.length * 3} stars`,
  'never-quit':     'Pass after 3 failed tries',
  'speed-run':      'Perfect timed finish',
};

// ─── 5-step challenge track ───────────────────────────────────────────────────

const STEPS = [
  { num: '01', label: 'Map Explorer',  desc: 'Click every state and province on the live SVG map',  tag: 'Train' },
  { num: '02', label: 'Code Drop',     desc: 'Catch the right state code before the block lands',   tag: 'Play'  },
  { num: '03', label: 'Pin Rush',      desc: 'Tap the right target while the map is live',          tag: 'Play'  },
  { num: '04', label: 'Tz Sorter',      desc: 'Drag states & provinces into the right timezone zone for combo points', tag: 'Play'  },
];

// ─── BadgeShelfModal ──────────────────────────────────────────────────────────

function BadgeShelfModal({
  earnedBadges,
  onClose,
}: {
  earnedBadges: string[];
  onClose: () => void;
}) {
  const earned = new Set(earnedBadges);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Badge shelf"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a2233] border border-white/10 rounded-3xl w-full max-w-sm max-h-[80vh] overflow-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/8 bg-[#1a2233]">
          <h2 className="text-white font-bold text-lg">Badge Shelf</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {BADGE_DEFS.map((badge) => {
            const isEarned = earned.has(badge.id);
            return (
              <div
                key={badge.id}
                className={[
                  'flex items-start gap-3 p-3 rounded-2xl border transition-all duration-300',
                  isEarned
                    ? 'border-[rgba(255,153,0,0.3)] bg-[rgba(255,153,0,0.07)] scale-100'
                    : 'border-white/6 bg-white/3 opacity-40 grayscale scale-95',
                ].join(' ')}
              >
                <span className="text-2xl leading-none mt-0.5 select-none" aria-hidden="true">
                  {BADGE_ICONS[badge.id] ?? '⭐'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{badge.name}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-snug">
                    {BADGE_DESCS[badge.id] ?? ''}
                  </p>
                  <span className={`text-xs font-medium ${isEarned ? 'text-[#FF9900]' : 'text-white/25'}`}>
                    {isEarned ? 'Earned' : 'Locked'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { createNewSession, session, clearCurrentSession } = useSession();
  const { playSound } = useAudio();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [waveCode,    setWaveCode]    = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [badgeOpen,   setBadgeOpen]   = useState(false);
  const navigatingRef = useRef(false);

  const formValid =
    name.trim().length >= 2 &&
    waveCode.trim().length >= 2 &&
    trainerName.trim().length >= 2;

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;
    playSound('click');
    navigatingRef.current = true;
    createNewSession(name.trim(), waveCode.trim(), trainerName.trim());
    navigate('/train/map');
  }

  function handleResume() {
    if (!session) return;
    playSound('click');
    if (session.completed) {
      navigate('/play/results');
    } else if (session.training.completed) {
      if (session.currentGameIndex === undefined || session.currentGameIndex === null) {
        session.currentGameIndex = 0;
      }
      navigate('/play');
    } else {
      navigate('/train/map');
    }
  }

  const earnedBadges = session?.earnedBadges ?? [];
  const previewIcons = earnedBadges.slice(0, 3);

  return (
    <AppLayout>
      <main className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-[#0c120e] relative">
        
        {/* Background Grain: Handled by .paper-texture overlay in AppLayout/Index.css if applicable,
            otherwise we rely on the clean dark surface for performance. */}

        {/* ── Left Panel: Entry/Form ────────────────────────────────────── */}
        <section className="relative z-10 w-full lg:w-[450px] flex-shrink-0 flex flex-col p-6 lg:p-12 overflow-y-auto lg:overflow-visible border-r border-white/5 bg-[#0c120e]/95 backdrop-blur-md">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#FF9900] flex items-center justify-center text-[#232F3E] font-extrabold text-xl shadow-[0_8px_0_#CC7A00] transform hover:translate-y-0.5 active:translate-y-1 transition-all">
                AE
              </div>
              <div>
                <h1 className="text-2xl font-black text-white leading-tight">Atlas Explorer</h1>
                <p className="text-[#FF9900] text-[13px] font-bold uppercase tracking-wider opacity-80">Geo Rush</p>
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-3 leading-tight">
              Initialize<br />Expedition
            </h2>
            <p className="text-white/60 text-sm max-w-xs mb-10">
              Welcome, Agent. Master the <strong className="text-[#FF9900]">Learning Zone</strong> to unlock access to the <strong className="text-[#FF9900]">3 tactical simulations</strong>.
            </p>
          </div>

          <div className="flex-1">
            {session && !navigatingRef.current ? (
              <AnimatedCard className="mb-8 rounded-2xl bg-[#232F3E] text-white p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <LottiePlayer src="assets/lottie/level-up.json" className="w-24 h-24" />
                </div>
                
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Active Session</p>
                <p className="font-black text-[#FEBD69] text-3xl mb-6">{session.name}</p>

                <button
                  type="button"
                  onClick={() => { playSound('click'); setBadgeOpen(true); }}
                  className="flex items-center gap-4 w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all mb-6 group"
                >
                  <div className="flex -space-x-2">
                    {previewIcons.map((id) => (
                      <div key={id} className="w-10 h-10 rounded-full bg-[#1a2233] border-2 border-[#232F3E] flex items-center justify-center text-xl shadow-lg" aria-hidden="true">
                        {BADGE_ICONS[id] ?? '⭐'}
                      </div>
                    ))}
                    {earnedBadges.length === 0 && (
                      <div className="w-10 h-10 rounded-full bg-[#1a2233] border-2 border-[#232F3E] flex items-center justify-center text-xl opacity-40" aria-hidden="true">
                        🏅
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-sm text-white group-hover:text-[#FF9900] transition-colors">Badge Shelf</strong>
                    <p className="text-white/40 text-[10px] font-bold">{earnedBadges.length}/{BADGE_DEFS.length} discovered</p>
                  </div>
                  <span className="text-white/30 text-xl group-hover:translate-x-1 transition-transform">›</span>
                </button>

                <button
                  type="button"
                  onClick={handleResume}
                  className="w-full py-4 rounded-xl bg-[#FF9900] text-[#232F3E] font-black hover:bg-[#FEBD69] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_6px_0_#CC7A00] text-base"
                >
                  Resume Protocol
                </button>

                <button
                  type="button"
                  onClick={() => { playSound('click'); clearCurrentSession(); }}
                  className="w-full py-3 mt-4 rounded-xl border-2 border-white/10 text-white/40 font-black hover:bg-white/5 transition-colors text-xs"
                >
                  Skip & Start Fresh
                </button>
              </AnimatedCard>
            ) : (
              <form onSubmit={handleStart} className="flex flex-col gap-8">
                <div className="space-y-7">
                  <div className="flex flex-col gap-4">
                    <label htmlFor="agent-name" className="text-white/40 text-[11px] uppercase tracking-widest font-extrabold flex items-center gap-1">
                      Player Tag <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="agent-name"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. Maverick"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border border-white/25 bg-white/5 rounded-xl px-5 py-3.5 text-white text-sm focus:border-[#FF9900] focus:ring-4 focus:ring-[#FF9900]/10 transition-all placeholder:text-white/30 font-bold shadow-inner backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <label htmlFor="wave-code" className="text-white/40 text-[11px] uppercase tracking-widest font-extrabold flex items-center gap-1">
                      iCube Wave Code <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="wave-code"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. WAVE-24"
                      value={waveCode}
                      onChange={(e) => setWaveCode(e.target.value)}
                      className="border border-white/25 bg-white/5 rounded-xl px-5 py-3.5 text-white text-sm focus:border-[#FF9900] focus:ring-4 focus:ring-[#FF9900]/10 transition-all placeholder:text-white/30 font-bold shadow-inner backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <label htmlFor="trainer-name" className="text-white/40 text-[11px] uppercase tracking-widest font-extrabold flex items-center gap-1">
                      Lead Trainer <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="trainer-name"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. Sarah J."
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      className="border border-white/25 bg-white/5 rounded-xl px-5 py-3.5 text-white text-sm focus:border-[#FF9900] focus:ring-4 focus:ring-[#FF9900]/10 transition-all placeholder:text-white/30 font-bold shadow-inner backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 pb-6">
                  <button
                    type="submit"
                    disabled={!formValid}
                    className="w-full py-4 rounded-xl bg-[#232F3E] text-white font-black disabled:opacity-30 hover:bg-[#2D3B2F] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed shadow-[0_6px_0_#151C25] text-base"
                  >
                    Start Deployment
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Right Panel: Visual Showcase ──────────────────────────────── */}
        <section className="hidden lg:flex flex-1 flex-col p-8 lg:p-12 bg-[#232F3E] relative overflow-y-auto custom-scrollbar">
          {/* Decorative topo pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'var(--geo-topo-pattern)', backgroundSize: '600px' }}
          />

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-end items-start mb-12 opacity-10">
              <LottiePlayer 
                src={publicAsset('assets/lottie/globe.json')} 
                className="w-32 h-32 -mt-4 drop-shadow-2xl"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center gap-12 lg:gap-20 py-12">
              <div className="max-w-md">
                <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 lg:mb-6 leading-[1.1]">
                  Tap fast, stack streaks,<br />
                  <span className="text-[#FF9900]">own the map.</span>
                </h2>
                <p className="text-white/50 text-lg leading-relaxed mb-10">
                  Complete the <strong className="text-[#FF9900]">prerequisite zone</strong> to prove your readiness for the <strong className="text-white">3 high-stakes simulations</strong> in the North America sector.
                </p>

                {/* Relocated and reduced prominence stats panel (Issue 1.1) */}
                <div className="space-y-4 pt-8 border-t border-white/10">
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Operational Readiness</p>
                  <div className="flex gap-10">
                    {[
                      { val: '01', label: 'Learning Zone' },
                      { val: '03', label: 'Tactical Sims' },
                      { val: '70%', label: 'Min Accuracy' },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-xl font-black text-white/80 leading-none">{item.val}</p>
                        <p className="text-white/20 text-[9px] font-bold mt-1.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STEPS.map((step) => (
                  <AnimatedCard key={step.num} tiltAmount={4} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative group overflow-hidden">
                    <div className={[
                      "absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg",
                      step.tag === 'Train' 
                        ? "bg-[#00A8A2] text-white" 
                        : "bg-[#FF9900] text-[#232F3E]"
                    ].join(' ')}>
                      {step.tag}
                    </div>
                    <div className={[
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm mb-4",
                      step.tag === 'Train' ? "bg-[#00A8A2]/20 text-[#00A8A2]" : "bg-[#FF9900]/20 text-[#FF9900]"
                    ].join(' ')}>
                      {step.num}
                    </div>
                    <h3 className="text-white font-black text-lg mb-2 group-hover:text-[#FF9900] transition-colors">{step.label}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
                  </AnimatedCard>
                ))}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between text-white/20">
              <p className="text-[10px] font-black uppercase tracking-widest">Sector: NA-01</p>
              <p className="text-[10px] font-black uppercase tracking-widest">v4.0.0-PRO</p>
            </div>
          </div>
        </section>
      </main>

      {/* Badge shelf modal */}
      {badgeOpen && (
        <BadgeShelfModal
          earnedBadges={earnedBadges}
          onClose={() => setBadgeOpen(false)}
        />
      )}
    </AppLayout>
  );
}
