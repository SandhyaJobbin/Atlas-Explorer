import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import type { StateEntry } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import TrainingTopBar from '@/components/layout/TrainingTopBar';
import InteractiveMap from '@/components/map/InteractiveMap';
import StateInfoPanel from '@/components/map/StateInfoPanel';
import { TZ_COLORS_HEX as TZ_COLORS } from '@/lib/timezones';

const TOTAL = 63;

const OBJECTIVES = [
  { label: 'Capitals', value: 'Identify each seat of government' },
  { label: 'Timezones', value: 'Track regional operating windows' },
  { label: 'Coasts', value: 'Spot Atlantic, Pacific, and inland routes' },
  { label: 'Specialties', value: 'Collect local notes and landmarks' },
];

const PIN_POSITIONS = [
  { top: '35%', left: '46%' },
  { top: '50%', left: '52%' },
  { top: '70%', left: '42%' },
];

function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

const MILESTONES = [
  { count: 10, label: 'Scout', icon: '⛺' },
  { count: 25, label: 'Wayfinder', icon: '🧭' },
  { count: 50, label: 'Cartographer', icon: '🗺️' },
  { count: 63, label: 'Completionist', icon: '🏆' },
];

export default function MapExplorerPage() {
  const { session, updateTraining } = useSession();
  const { playSound } = useAudio();
  const navigate = useNavigate();

  const [states, setStates] = useState<StateEntry[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'exploring'>('intro');
  const [passportOpen, setPassportOpen] = useState(() => {
    return localStorage.getItem('atlas_passportOpen') === 'true';
  });
  const [showLegend, setShowLegend] = useState(() => {
    return localStorage.getItem('atlas_showLegend') === 'true';
  });
  const [hoveredTimezone, setHoveredTimezone] = useState<string | null>(null);
  const [milestonePopup, setMilestonePopup] = useState<{ label: string, icon: string } | null>(null);

  const clicked = session?.training.mapExplorerClicked ?? [];
  const activeState = states.find((s) => s.code === activeCode) ?? null;
  const allDone = clicked.length >= TOTAL;

  const timezoneMap = useMemo(() => {
    return states.reduce((acc, s) => {
      acc[s.code] = s.timezone;
      return acc;
    }, {} as Record<string, string>);
  }, [states]);

  const stats = useMemo(() => {
    const clickedStates = states.filter((s) => clicked.includes(s.code));
    
    const byCountry = {
      US: { current: clickedStates.filter(s => s.country === 'US').length, total: states.filter(s => s.country === 'US').length },
      CA: { current: clickedStates.filter(s => s.country === 'CA').length, total: states.filter(s => s.country === 'CA').length },
    };

    const timezones = ['PST', 'MST', 'CST', 'EST', 'AKST', 'AST', 'NST', 'HST'];
    const byTimezone = timezones.map(tz => ({
      tz,
      current: clickedStates.filter(s => s.timezone === tz).length,
      total: states.filter(s => s.timezone === tz).length,
    }));

    const coasts = ['West Coast', 'East Coast', 'Gulf Coast', 'Inland'];
    const byCoast = coasts.map(coast => ({
      coast,
      current: clickedStates.filter(s => s.coast === coast).length,
      total: states.filter(s => s.coast === coast).length,
    }));

    return { byCountry, byTimezone, byCoast };
  }, [states, clicked]);

  useEffect(() => {
    localStorage.setItem('atlas_passportOpen', passportOpen.toString());
  }, [passportOpen]);

  useEffect(() => {
    localStorage.setItem('atlas_showLegend', showLegend.toString());
  }, [showLegend]);

  const passportTrivia = useMemo(() => {
    if (clicked.length === 0) return null;
    const exploredStates = states.filter(s => clicked.includes(s.code) && s.trivia && s.trivia.length > 0);
    if (exploredStates.length === 0) return null;
    const randomState = exploredStates[Math.floor(Math.random() * exploredStates.length)];
    const triviaList = randomState.trivia || [];
    const randomTrivia = triviaList[Math.floor(Math.random() * triviaList.length)];
    return { name: randomState.name, text: randomTrivia };
  }, [clicked.length, states]);

  useEffect(() => {
    fetch(publicAsset('/data/states.json'))
      .then((r) => r.json())
      .then(setStates)
      .catch(console.error);
  }, []);

  function handleRegionClick(code: string) {
    const wasAlreadyClicked = clicked.includes(code);
    setActiveCode(code);
    
    if (!wasAlreadyClicked) {
      playSound('click');
      updateTraining('map', code);
      
      const newCount = clicked.length + 1;
      const milestone = MILESTONES.find(m => m.count === newCount);
      if (milestone) {
        playSound('badge');
        setMilestonePopup(milestone);
        setTimeout(() => setMilestonePopup(null), 3000);
      }
    }
  }

  function handleExit() {
    if (window.confirm('Are you sure you want to exit the training session?')) {
      navigate('/');
    }
  }

  return (
    <AppLayout variant="training">
      <TrainingTopBar
        explored={clicked.length}
        total={TOTAL}
        label="Map Explorer"
        onExit={handleExit}
      />

      {phase === 'intro' ? (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#232F3E]">
          <section className="relative flex-1 min-h-56 lg:min-h-0 overflow-hidden bg-[#232F3E] flex items-center justify-center border-r border-white/10">
            <div
              className="absolute inset-0 opacity-[0.14] pointer-events-none"
              style={{ backgroundImage: `url("${publicAsset('/assets/patterns/topo-pattern.png')}")`, backgroundSize: '420px' }}
            />
            <img
              src={publicAsset('/assets/illustrations/map-bg.png')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <img
              src={publicAsset('/maps/north-america.svg')}
              alt=""
              className="relative z-10 h-full w-full max-w-3xl object-contain p-8 lg:p-14 opacity-80 drop-shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
            />
            <img
              src={publicAsset('/assets/illustrations/globe-illustration.png')}
              alt=""
              className="absolute bottom-5 left-6 z-20 w-24 sm:w-32 lg:w-40 opacity-90 drop-shadow-2xl"
            />
            <img
              src={publicAsset('/assets/illustrations/compass-rose.svg')}
              alt=""
              className="absolute right-5 top-5 z-20 w-20 sm:w-28 opacity-45"
            />
            {PIN_POSITIONS.map((pin) => (
              <img
                key={`${pin.top}-${pin.left}`}
                src={publicAsset('/assets/stickers/pin-bounce.gif')}
                alt=""
                className="absolute z-30 w-12 sm:w-14 -translate-x-1/2 -translate-y-full drop-shadow-[0_16px_18px_rgba(0,0,0,0.35)]"
                style={{ top: pin.top, left: pin.left }}
              />
            ))}
            <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-6 py-2 text-center shadow-2xl backdrop-blur-md">
              <div className="text-[9px] font-black uppercase tracking-wider text-white/45">Training Zone</div>
              <div className="text-sm font-black uppercase tracking-tight text-[#00A8A2]">North America Atlas</div>
            </div>
          </section>

          <section className="relative w-full lg:w-[460px] overflow-hidden bg-[#F5F0E8] p-7 sm:p-10 lg:p-12 flex flex-col justify-center gap-7 paper-texture">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-[0.05] pointer-events-none"
              src={publicAsset('/assets/video/paper-bg.mp4')}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2.5 bg-[#232F3E]/5 px-3 py-1.5 rounded-lg border border-[#232F3E]/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#232F3E]/40">
                  Phase 00
                </span>
                <div className="w-px h-3 bg-[#232F3E]/10" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00A8A2]">
                  Atlas calibration
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#232F3E] slide-up">
                Map Explorer
              </h1>
            </div>

            <p className="relative z-10 text-base font-medium leading-relaxed text-[#2D3B2F]/70 slide-up stagger-1">
              Your mission is to explore all {TOTAL} states and provinces of North America. Click each region to learn about its capital, timezone, and coast.
            </p>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {OBJECTIVES.map((objective, idx) => (
                <div key={objective.label} className={`rounded-2xl border-2 border-[#232F3E]/5 bg-white/75 p-4 shadow-sm backdrop-blur-sm pop-in ${idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : idx === 2 ? 'stagger-3' : 'stagger-4'}`}>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#232F3E]/35">
                    {objective.label}
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[#232F3E]">
                    {objective.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <button
                onClick={() => setPhase('exploring')}
                className="w-full btn-chunky btn-chunky-primary py-5 text-lg"
              >
                {allDone ? 'Return to Map' : 'Begin Exploration'}
              </button>
              {allDone && (
                <button
                  onClick={() => navigate('/train/complete')}
                  className="w-full btn-chunky btn-chunky-orange py-5 text-lg"
                >
                  Continue to Results
                </button>
              )}
              <p className="mt-2 text-center text-[10px] font-bold text-[#232F3E]/35">
                {TOTAL} regions to explore
              </p>
            </div>
          </section>
        </main>
      ) : (
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#1F2937]">
          <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 relative">
            <div className="z-10 flex flex-col sm:flex-row items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30">EXPEDITION PROGRESS</span>
                    <h2 className="text-white font-black text-xl tracking-tight">Interactive Map</h2>
                  </div>
                  <div className="text-right leading-none">
                    <span className="text-3xl font-black text-[#00A8A2] tabular-nums">{clicked.length}</span>
                    <span className="text-xs font-bold text-white/20 ml-2 tracking-wider">/ {TOTAL} Regions</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden ring-4 ring-black/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A8A2] to-[#35D07F] rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(0,168,162,0.4)]"
                    style={{ width: `${(clicked.length / TOTAL) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="hidden sm:block h-12 w-px bg-white/10 mx-2" />

              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className="flex gap-2.5 items-center bg-black/30 px-3.5 py-2 rounded-xl border border-white/5 shadow-inner flex-1 justify-center sm:justify-start">
                  {MILESTONES.map((m) => (
                    <div 
                      key={m.count} 
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-base filter ${clicked.length >= m.count ? 'grayscale-0 opacity-100 scale-110 shadow-lg bg-white/10 border border-white/10' : 'grayscale opacity-20'} transition-all duration-500`}
                      aria-label={`${m.label} milestone: ${clicked.length >= m.count ? 'Achieved' : 'Locked'}`}
                    >
                      <span aria-hidden="true">{m.icon}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className={`flex flex-col items-center justify-center w-14 h-14 min-w-[56px] rounded-xl border transition-all duration-300 ${
                    showLegend 
                      ? 'bg-[#00A8A2]/20 border-[#00A8A2] text-[#00A8A2] shadow-[0_0_15px_rgba(0,168,162,0.2)]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                  aria-label={showLegend ? "Hide Map Legend" : "Show Map Legend"}
                >
                  <span className="text-xl mb-0.5" aria-hidden="true">🗺️</span>
                  <span className="text-[8px] font-black uppercase tracking-wider leading-none">Legend</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative rounded-xl ring-1 ring-white/10 shadow-2xl">
              <InteractiveMap
                onRegionClick={handleRegionClick}
                highlightedCodes={clicked}
                activeCode={activeCode}
                mode="explore"
                timezoneMap={timezoneMap}
                hoveredTimezone={hoveredTimezone}
              />

              {showLegend && (
                <div className="absolute top-3 left-3 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="rounded-xl border border-white/10 bg-[#0d1a0d]/85 p-3 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-[8px] font-black uppercase tracking-wider text-white/40">Timezone Guide</p>
                      <button onClick={() => setShowLegend(false)} className="text-white/20 hover:text-white/60">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(TZ_COLORS).map(([tz, color]) => (
                        <div 
                          key={tz} 
                          className={`flex items-center gap-2.5 p-1 rounded-md transition-all cursor-default ${hoveredTimezone === tz ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}
                          onMouseEnter={() => setHoveredTimezone(tz)}
                          onMouseLeave={() => setHoveredTimezone(null)}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)] ${hoveredTimezone === tz ? 'ring-2 ring-white/50' : ''}`} />
                          <span className={`text-[9px] font-bold transition-colors ${hoveredTimezone === tz ? 'text-[#00A8A2]' : 'text-white/80'}`}>{tz}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {milestonePopup && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" aria-live="polite">
                  <div className="bg-[#232F3E] border-2 border-[#FEBD69] rounded-3xl p-8 shadow-[0_0_100px_rgba(254,189,105,0.3)] animate-in zoom-in-75 duration-500 text-center">
                    <div className="text-6xl mb-4">{milestonePopup.icon}</div>
                    <div className="text-[#FEBD69] text-[10px] font-black uppercase tracking-wider mb-1">Milestone Reached!</div>
                    <div className="text-3xl font-black text-white">{milestonePopup.label}</div>
                    <div className="text-white/40 text-[10px] font-bold mt-2 tracking-widest">{clicked.length} Regions Explored</div>
                  </div>
                </div>
              )}

              {activeState && (
                <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex max-h-[calc(100%-2rem)] justify-end animate-in fade-in slide-in-from-right-4 duration-300 sm:inset-x-auto sm:right-4 sm:w-80">
                  <StateInfoPanel state={activeState} onClose={() => setActiveCode(null)} />
                </div>
              )}

              {allDone && (
                <div className="absolute bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 mb-16 sm:mb-0">
                  <button
                    onClick={() => navigate('/train/complete')}
                    className="btn-chunky btn-chunky-orange py-3 px-6 text-sm flex items-center gap-2"
                  >
                    Continue to Results <span className="text-xl">-&gt;</span>
                  </button>
                </div>
              )}
            </div>

          {/* Atlas Passport Toggle */}
          <button
            onClick={() => setPassportOpen(!passportOpen)}
            className={`absolute bottom-3 left-3 z-50 flex items-center gap-2 btn-chunky px-4 py-2.5 text-[10px] transition-all ${passportOpen ? 'btn-chunky-orange' : 'btn-chunky-primary'}`}
          >
            <span>{passportOpen ? '📖' : '📘'}</span>
            {passportOpen ? 'Close Passport' : 'Atlas Passport'}
          </button>

          {/* Atlas Passport Drawer */}
          <div 
            className={`absolute inset-x-0 bottom-0 z-[60] bg-[#101b12]/95 backdrop-blur-xl border-t border-white/10 transition-transform duration-500 ease-in-out shadow-[0_-20px_50px_rgba(0,0,0,0.5)] ${passportOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ height: '320px' }}
          >
            <button 
              onClick={() => setPassportOpen(false)}
              className="absolute -top-12 right-6 bg-[#101b12]/90 p-2 rounded-t-xl border-t border-x border-white/10 text-white/40 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="h-full overflow-y-auto p-6 scrollbar-hide">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Overall & Countries */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-white font-black text-xs tracking-widest mb-3 opacity-50">Exploration Progress</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black text-white uppercase">United States</span>
                          <span className="text-xs font-mono text-[#00A8A2]">{stats.byCountry.US.current}/{stats.byCountry.US.total}</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A8A2]" style={{ width: `${(stats.byCountry.US.current / stats.byCountry.US.total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black text-white uppercase">Canada</span>
                          <span className="text-xs font-mono text-[#C41E3A]">{stats.byCountry.CA.current}/{stats.byCountry.CA.total}</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C41E3A]" style={{ width: `${(stats.byCountry.CA.current / stats.byCountry.CA.total) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-black text-xs tracking-widest mb-3 opacity-50">Coastal Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.byCoast.map(c => (
                        <div key={c.coast} className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                          <span className="text-[9px] font-bold text-white/60 uppercase">{c.coast}</span>
                          <span className={`text-[10px] font-mono ${c.current === c.total ? 'text-[#22C55E]' : 'text-white'}`}>
                            {c.current === c.total ? '✓' : `${c.current}/${c.total}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Timezones */}
                <div className="w-full md:w-80">
                  <h3 className="text-white font-black text-xs tracking-widest mb-3 opacity-50">Timezone Stamps</h3>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 grid grid-cols-2 gap-3">
                    {stats.byTimezone.map(tz => (
                      <div key={tz.tz} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${TZ_COLORS[tz.tz]}`} />
                          <span className="text-[10px] font-bold text-white/50">{tz.tz}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/80">{tz.current}/{tz.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Far Right: Specialty Insight (Dataset use) */}
                <div className="hidden lg:block w-64 border-l border-white/5 pl-8">
                  <h3 className="text-white font-black text-xs tracking-widest mb-3 opacity-50">Atlas Trivia</h3>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[8px] font-black text-[#00A8A2] uppercase tracking-wider mb-1">Knowledge Coverage</p>
                      <p className="text-xl font-mono text-white font-black">{Math.round((clicked.length / TOTAL) * 100)}%</p>
                    </div>
                    
                    {passportTrivia ? (
                        <div className="bg-white/5 rounded-2xl p-4 border border-dashed border-[#00A8A2]/30">
                          <p className="text-[8px] font-black text-[#FF9900] uppercase tracking-wider mb-1">Did you know?</p>
                          <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                            {passportTrivia.text}
                          </p>
                          <p className="text-[8px] text-white/30 mt-2 text-right">— {passportTrivia.name}</p>
                        </div>
                    ) : (
                      <div className="p-2 opacity-30 text-[9px] text-white leading-relaxed italic">
                        "Select territories on the map to unlock regional intelligence and trivia insights."
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )}
    </AppLayout>
  );
}
