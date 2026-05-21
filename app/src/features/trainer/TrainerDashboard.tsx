import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  generateTrainerReport, 
  downloadTrainerReportJSON, 
  exportTrainerReportJSON, 
  type TrainerWaveReport 
} from '@/lib/trainer-report';
import { readLocalScores } from '@/lib/leaderboard';
import { 
  Users, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Download, 
  Projector, 
  ArrowLeft, 
  BarChart2, 
  TrendingUp, 
  Sparkles, 
  Award,
  Check,
  Copy
} from 'lucide-react';

export default function TrainerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse initial wave from URL search params
  const queryParams = new URLSearchParams(location.search);
  const initialWave = queryParams.get('wave') || 'WAVE-24';

  const [currentWave, setCurrentWave] = useState(initialWave);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-refresh countdown & trigger
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setRefreshTrigger((t) => t + 1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update URL when wave changes
  const handleWaveChange = (newWave: string) => {
    setCurrentWave(newWave);
    navigate(`/trainer?wave=${encodeURIComponent(newWave)}`, { replace: true });
    setRefreshTrigger((t) => t + 1);
    setRefreshCountdown(15);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((t) => t + 1);
    setRefreshCountdown(15);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Derive available waves from local storage
  const availableWaves = useMemo(() => {
    void refreshTrigger;
    const scores = readLocalScores();
    const waves = Array.from(new Set(scores.map((s) => (s.waveCode as string) || '').filter(Boolean)));
    if (waves.length === 0) return [initialWave];
    if (!waves.includes(currentWave)) {
      waves.push(currentWave);
    }
    return waves.sort();
  }, [refreshTrigger, currentWave, initialWave]);

  // Generate report data
  const report: TrainerWaveReport = useMemo(() => {
    return generateTrainerReport(currentWave);
  }, [currentWave, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyJSON = useCallback(() => {
    const json = exportTrainerReportJSON(currentWave);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentWave]);

  // Calculate histogram buckets for Time-to-Complete distribution
  const histogramBuckets = useMemo(() => {
    const buckets = [
      { label: '< 15 min', min: 0, max: 15, count: 0 },
      { label: '15-30 min', min: 15, max: 30, count: 0 },
      { label: '30-45 min', min: 30, max: 45, count: 0 },
      { label: '45-60 min', min: 45, max: 60, count: 0 },
      { label: '60+ min', min: 60, max: 999, count: 0 },
    ];

    report.standoutPerformers.forEach((p) => {
      const mins = p.estimatedMinutes || 0;
      for (const b of buckets) {
        if (mins >= b.min && mins < b.max) {
          b.count += 1;
          break;
        }
      }
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return buckets.map((b) => ({
      ...b,
      percentage: Math.round((b.count / maxCount) * 100),
    }));
  }, [report.standoutPerformers]);

  return (
    <div className={`min-h-screen bg-atlas-warm text-atlas-ink flex flex-col font-ui transition-colors duration-300 ${isProjectMode ? 'bg-white' : ''}`}>
      {/* Top Navigation / Header Bar */}
      <header className={`px-6 py-4 bg-atlas-card border-b border-atlas-border flex items-center justify-between shadow-sm transition-all ${isProjectMode ? 'py-6 border-b-2 border-atlas-accent/20 bg-atlas-warm/30' : ''}`}>
        <div className="flex items-center gap-4">
          {!isProjectMode && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 rounded-xl border border-atlas-border hover:bg-atlas-warm transition-colors text-atlas-muted hover:text-atlas-ink"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold font-display tracking-tight text-atlas-ink flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-atlas-accent animate-pulse" />
                Trainer Dashboard
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-atlas-accent-light text-atlas-accent border border-atlas-accent/20 shadow-xs uppercase tracking-wider">
                Live Classroom
              </span>
            </div>
            {!isProjectMode && (
              <p className="text-xs text-atlas-muted mt-0.5">
                Monitoring active trainees, performance distribution, and wave progress.
              </p>
            )}
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-3">
          {/* Wave Selector Dropdown */}
          {!isProjectMode ? (
            <div className="flex items-center gap-2 bg-atlas-warm px-3 py-1.5 rounded-xl border border-atlas-border shadow-xs">
              <span className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Wave:</span>
              <select
                value={currentWave}
                onChange={(e) => handleWaveChange(e.target.value)}
                className="bg-transparent text-sm font-black text-atlas-ink pr-6 py-0.5 focus:outline-none cursor-pointer"
              >
                {availableWaves.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-atlas-accent-light text-atlas-accent font-black text-lg border border-atlas-accent/30 shadow-xs">
              Wave: {currentWave}
            </div>
          )}

          {/* Auto-Refresh Status */}
          {!isProjectMode && (
            <div className="flex items-center gap-2 bg-atlas-warm px-3 py-1.5 rounded-xl border border-atlas-border shadow-xs">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-1 rounded-lg hover:bg-atlas-border/50 text-atlas-muted hover:text-atlas-ink transition-colors"
                title="Refresh Now"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-atlas-accent' : ''}`} />
              </button>
              <span className="text-xs font-medium text-atlas-muted min-w-[100px]">
                Refreshes in <span className="font-bold text-atlas-ink">{refreshCountdown}s</span>
              </span>
            </div>
          )}

          {/* Export JSON / Debug Actions (Hidden in Project Mode) */}
          {!isProjectMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadTrainerReportJSON(currentWave)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-atlas-card border border-atlas-border hover:bg-atlas-warm transition-all text-xs font-bold text-atlas-ink shadow-xs hover:shadow-sm"
                title="Download JSON Report"
              >
                <Download className="w-4 h-4 text-atlas-accent" />
                Download JSON
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-atlas-card border border-atlas-border hover:bg-atlas-warm transition-all text-xs font-bold text-atlas-ink shadow-xs hover:shadow-sm"
                title="Copy JSON Payload"
              >
                {copied ? <Check className="w-4 h-4 text-atlas-accent" /> : <Copy className="w-4 h-4 text-atlas-muted" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
          )}

          {/* Project Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsProjectMode(!isProjectMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-all ${
              isProjectMode
                ? 'bg-atlas-accent text-white shadow-md ring-2 ring-atlas-accent ring-offset-2'
                : 'bg-atlas-card border border-atlas-border text-atlas-ink hover:bg-atlas-warm'
            }`}
            title="Toggle Projector Mode for Classroom Display"
          >
            <Projector className="w-4 h-4" />
            {isProjectMode ? 'Exit Project Mode' : 'Project Mode'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6 ${isProjectMode ? 'max-w-none px-12 py-8 gap-8' : ''}`}>
        {/* Key Metrics Overview Grid */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isProjectMode ? 'gap-6' : ''}`}>
          {/* Active Explorers Card */}
          <div className={`bg-atlas-card p-5 rounded-2xl border border-atlas-border shadow-xs flex items-center justify-between transition-all ${isProjectMode ? 'p-6 border-2 border-atlas-border shadow-sm' : ''}`}>
            <div>
              <p className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Active Explorers</p>
              <h2 className={`font-black text-atlas-ink mt-1 ${isProjectMode ? 'text-4xl' : 'text-2xl'}`}>
                {report.totalParticipants}
              </h2>
              <p className="text-xs text-atlas-muted mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-atlas-accent" /> Registered in wave
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-atlas-accent-light text-atlas-accent ${isProjectMode ? 'scale-125 origin-right' : ''}`}>
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Overall Pass Rate Card */}
          <div className={`bg-atlas-card p-5 rounded-2xl border border-atlas-border shadow-xs flex items-center justify-between transition-all ${isProjectMode ? 'p-6 border-2 border-atlas-border shadow-sm' : ''}`}>
            <div>
              <p className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Overall Pass Rate</p>
              <h2 className={`font-black text-atlas-ink mt-1 ${isProjectMode ? 'text-4xl' : 'text-2xl'}`}>
                {report.overallPassRate}%
              </h2>
              <p className="text-xs text-atlas-muted mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-atlas-accent" /> Completed all games
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-atlas-accent-light text-atlas-accent ${isProjectMode ? 'scale-125 origin-right' : ''}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Average Score Card */}
          <div className={`bg-atlas-card p-5 rounded-2xl border border-atlas-border shadow-xs flex items-center justify-between transition-all ${isProjectMode ? 'p-6 border-2 border-atlas-border shadow-sm' : ''}`}>
            <div>
              <p className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Average Score</p>
              <h2 className={`font-black text-atlas-ink mt-1 ${isProjectMode ? 'text-4xl' : 'text-2xl'}`}>
                {report.averageScore}%
              </h2>
              <p className="text-xs text-atlas-muted mt-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-atlas-gold" /> Across all attempts
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-[#FFFDE7] text-atlas-gold border border-atlas-gold/20 ${isProjectMode ? 'scale-125 origin-right' : ''}`}>
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          {/* Estimated Completion Time Card */}
          <div className={`bg-atlas-card p-5 rounded-2xl border border-atlas-border shadow-xs flex items-center justify-between transition-all ${isProjectMode ? 'p-6 border-2 border-atlas-border shadow-sm' : ''}`}>
            <div>
              <p className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Avg Completion Time</p>
              <h2 className={`font-black text-atlas-ink mt-1 ${isProjectMode ? 'text-4xl' : 'text-2xl'}`}>
                {report.estimatedCompletionMinutes} <span className="text-lg font-bold text-atlas-muted">min</span>
              </h2>
              <p className="text-xs text-atlas-muted mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-atlas-accent" /> 60 min session budget
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-atlas-accent-light text-atlas-accent ${isProjectMode ? 'scale-125 origin-right' : ''}`}>
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Secondary Analytics: Per-Game Breakdown & Histogram (Hidden in Project Mode) */}
        {!isProjectMode && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Per-Game Breakdown Cards (Takes 2 Columns) */}
            <div className="lg:col-span-2 bg-atlas-card p-6 rounded-2xl border border-atlas-border shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-atlas-border pb-4">
                <h3 className="text-lg font-black font-display tracking-tight text-atlas-ink flex items-center gap-2">
                  <Award className="w-5 h-5 text-atlas-accent" />
                  Per-Game Performance Breakdown
                </h3>
                <span className="text-xs text-atlas-muted font-bold">
                  Total Attempts & Pass Rates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                {Object.values(report.perGameBreakdown).map((game) => (
                  <div key={game.gameKey} className="p-4 rounded-xl bg-atlas-warm border border-atlas-border flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-atlas-ink truncate">{game.gameLabel}</span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-atlas-card border border-atlas-border text-atlas-muted uppercase tracking-wider font-mono">
                        {game.gameKey}
                      </span>
                    </div>

                    {/* Pass Rate Progress Bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-atlas-muted uppercase tracking-wider">Pass Rate</span>
                        <span className="text-base font-black text-atlas-accent font-mono">{game.passRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-atlas-border rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-atlas-accent rounded-full transition-all duration-500" 
                          style={{ width: `${game.passRate}%` }} 
                        />
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-atlas-border/60 text-xs font-medium text-atlas-muted">
                      <div>
                        <span className="block text-xs uppercase font-bold text-atlas-muted">Avg Score</span>
                        <span className="font-bold text-atlas-ink font-mono">{game.averageScore}%</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase font-bold text-atlas-muted">Attempts</span>
                        <span className="font-bold text-atlas-ink font-mono">{game.passedAttempts} / {game.totalAttempts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time-to-Complete Distribution Histogram Card */}
            <div className="bg-atlas-card p-6 rounded-2xl border border-atlas-border shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-atlas-border pb-4">
                <h3 className="text-lg font-black font-display tracking-tight text-atlas-ink flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-atlas-gold" />
                  Time-to-Complete Distribution
                </h3>
                <span className="text-xs text-atlas-muted font-bold">
                  Explorer Pace
                </span>
              </div>

              {/* Histogram Bars */}
              <div className="flex-1 flex items-end justify-between gap-2 pt-6 pb-2 px-4 bg-atlas-warm rounded-xl border border-atlas-border min-h-[180px]">
                {histogramBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Tooltip & Count */}
                    <span className="text-xs font-bold text-atlas-ink font-mono bg-atlas-card px-1.5 py-0.5 rounded border border-atlas-border shadow-2xs group-hover:scale-110 transition-transform">
                      {bucket.count}
                    </span>

                    {/* Bar */}
                    <div className="w-full bg-atlas-border rounded-t-lg overflow-hidden flex items-end h-[120px] shadow-inner">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                          bucket.count > 0 ? 'bg-atlas-accent shadow-sm' : 'bg-transparent'
                        }`}
                        style={{ height: `${bucket.percentage}%` }}
                      />
                    </div>

                    {/* Label */}
                    <span className="text-xs font-bold text-atlas-muted text-center tracking-normal truncate w-full">
                      {bucket.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-atlas-muted text-center italic">
                Distribution of estimated completion times across the wave.
              </p>
            </div>
          </section>
        )}

        {/* Leaderboard Table Section (All Participants) */}
        <section className={`bg-atlas-card rounded-2xl border border-atlas-border shadow-xs flex flex-col overflow-hidden transition-all ${isProjectMode ? 'border-2 border-atlas-border shadow-md' : ''}`}>
          <div className={`p-6 border-b border-atlas-border bg-atlas-warm/50 flex items-center justify-between ${isProjectMode ? 'p-8 bg-atlas-warm' : ''}`}>
            <div>
              <h3 className={`font-black font-display tracking-tight text-atlas-ink flex items-center gap-2 ${isProjectMode ? 'text-3xl' : 'text-xl'}`}>
                <TrendingUp className={`text-atlas-accent ${isProjectMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
                Wave Leaderboard & Standings
              </h3>
              <p className={`text-atlas-muted mt-1 ${isProjectMode ? 'text-base font-medium' : 'text-xs'}`}>
                Complete standings for all active explorers in <span className="font-bold text-atlas-ink">{currentWave}</span>. Updated in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg font-mono font-bold bg-atlas-card border border-atlas-border text-atlas-ink shadow-2xs ${isProjectMode ? 'text-lg px-4 py-2' : 'text-xs'}`}>
                Total: {report.standoutPerformers.length} Explorers
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b border-atlas-border bg-atlas-warm/30 text-atlas-muted uppercase tracking-wider font-bold select-none ${isProjectMode ? 'text-sm' : 'text-xs'}`}>
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Explorer (Agent)</th>
                  <th className="py-4 px-6 text-center">Total Score</th>
                  <th className="py-4 px-6 text-center">Stars Earned</th>
                  <th className="py-4 px-6 text-center">Games Passed</th>
                  <th className="py-4 px-6 text-center">Est. Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atlas-border">
                {report.standoutPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-atlas-muted font-medium italic text-sm">
                      No explorer attempts recorded for this wave yet. Trainees playing in this wave will appear here instantly.
                    </td>
                  </tr>
                ) : (
                  report.standoutPerformers.map((row) => {
                    let rankBadge = '';
                    if (row.rank === 1) rankBadge = '🥇';
                    else if (row.rank === 2) rankBadge = '🥈';
                    else if (row.rank === 3) rankBadge = '🥉';

                    const isTop3 = row.rank <= 3;

                    return (
                      <tr 
                        key={row.agent} 
                        className={`transition-colors hover:bg-atlas-warm/60 ${
                          isTop3 ? 'bg-atlas-accent-light/30 font-semibold' : ''
                        } ${isProjectMode ? 'text-lg font-bold' : 'text-sm'}`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-6 text-center font-mono font-black">
                          {rankBadge ? (
                            <span className={`inline-block ${isProjectMode ? 'text-2xl' : 'text-lg'}`}>{rankBadge}</span>
                          ) : (
                            <span className="text-atlas-muted">#{row.rank}</span>
                          )}
                        </td>

                        {/* Explorer Agent */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0 ${
                              isTop3 
                                ? 'bg-atlas-accent text-white' 
                                : 'bg-atlas-warm border border-atlas-border text-atlas-ink'
                            } ${isProjectMode ? 'w-10 h-10 text-sm' : ''}`}>
                              {row.agent.slice(0, 2).toUpperCase()}
                            </div>
                            <span className={`truncate font-bold ${isTop3 ? 'text-atlas-accent font-black' : 'text-atlas-ink'} ${isProjectMode ? 'text-xl' : ''}`}>
                              {row.agent}
                            </span>
                          </div>
                        </td>

                        {/* Total Score */}
                        <td className="py-4 px-6 text-center font-mono font-bold text-atlas-ink">
                          <span className={`px-2.5 py-1 rounded-lg bg-atlas-warm border border-atlas-border ${isProjectMode ? 'px-3.5 py-1.5 text-xl' : ''}`}>
                            {row.totalScore}%
                          </span>
                        </td>

                        {/* Stars Earned */}
                        <td className="py-4 px-6 text-center font-mono font-bold text-atlas-ink">
                          <span className="flex items-center justify-center gap-1">
                            {row.totalStars} <span className="text-base">⭐</span>
                          </span>
                        </td>

                        {/* Games Passed */}
                        <td className="py-4 px-6 text-center font-mono font-bold">
                          <span className={`px-2.5 py-1 rounded-lg ${
                            row.gamesPassed >= 3 
                              ? 'bg-atlas-accent-light text-atlas-accent border border-atlas-accent/30 font-black' 
                              : 'bg-atlas-warm text-atlas-muted border border-atlas-border'
                          } ${isProjectMode ? 'px-3.5 py-1.5 text-xl' : ''}`}>
                            {row.gamesPassed} / 3
                          </span>
                        </td>

                        {/* Est. Time */}
                        <td className="py-4 px-6 text-center font-mono font-medium text-atlas-muted">
                          {row.estimatedMinutes} min
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
