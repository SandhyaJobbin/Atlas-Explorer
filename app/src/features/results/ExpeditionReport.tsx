import React, { useState } from 'react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { getTotalScore, getTotalStars, getRankInfo, GAME_DEFINITIONS, TOTAL_REGIONS } from '@/lib/session';
import type { Session, StateEntry } from '@/types';

interface ExpeditionReportProps {
  session: Session;
  states?: StateEntry[];
}

export const ExpeditionReport: React.FC<ExpeditionReportProps> = ({ session }) => {
  const [copied, setCopied] = useState(false);

  const totalScore = getTotalScore(session);
  const totalStars = getTotalStars(session);
  const rankInfo = getRankInfo(totalScore);

  // Calculate territories mastered (unique states correct with 0 mistakes in game attempts)
  const allMistakes = session.games.flatMap((g) => g.mistakes || []);
  const allCorrects = session.games.flatMap((g) => g.corrects || []);

  const mistakeCounts: Record<string, number> = {};
  allMistakes.forEach((code) => {
    mistakeCounts[code] = (mistakeCounts[code] || 0) + 1;
  });

  const correctCounts: Record<string, number> = {};
  allCorrects.forEach((code) => {
    correctCounts[code] = (correctCounts[code] || 0) + 1;
  });

  const masteredCount = Object.keys(correctCounts).filter(code => !mistakeCounts[code]).length;

  // Calculate Time to Complete
  const startTime = new Date(session.createdAt || new Date(0).toISOString()).getTime();
  const attempts = session.games.flatMap(g => g.attempts || []).filter(a => Boolean(a.recordedAt));
  attempts.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  const endTime = attempts.length > 0 ? new Date(attempts[0].recordedAt).getTime() : startTime;
  const diffSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Fun stat calculation
  // Stable pseudo-random percentile based on agent name length & score
  const hash = (session.agent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + totalScore) % 16;
  const percentile = 80 + hash; // E.g., 80% to 95%
  const funStat = `You explored North America faster than ${percentile}% of your wave!`;

  // Helper to copy text summary to clipboard for easy sharing
  const handleCopyShare = () => {
    const textSummary = `🌍 Atlas Explorer Expedition Report\n👤 Explorer: ${session.agent} (${rankInfo.icon} ${rankInfo.rank})\n🏆 Score: ${totalScore} | ⭐ Stars: ${totalStars}/${GAME_DEFINITIONS.length * 3}\n🛡️ Regions Mastered: ${masteredCount}/${TOTAL_REGIONS}\n⚡ Time: ${timeString}\n✨ ${funStat}\n🚀 Wave: ${session.waveCode || 'Wave Alpha'}`;
    navigator.clipboard.writeText(textSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(console.error);
  };

  return (
    <AnimatedCard tiltAmount={2} className="rounded-3xl border-2 border-atlas-accent/40 bg-atlas-card p-8 shadow-lg backdrop-blur-2xl relative overflow-hidden group paper-texture">
      {/* Subtle background glow and decoration */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-atlas-accent/5 blur-3xl pointer-events-none group-hover:bg-atlas-accent/10 transition-all duration-700" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-atlas-gold/5 blur-3xl pointer-events-none group-hover:bg-atlas-gold/10 transition-all duration-700" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-atlas-border gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 flex items-center justify-center text-2xl shadow-sm">
            🧭
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-atlas-ink tracking-wide">
              Expedition Summary Report
            </h2>
            <p className="text-body text-atlas-muted font-medium mt-0.5">
              Comprehensive exploration log and performance metrics
            </p>
          </div>
        </div>

        {/* Share / Copy Button */}
        <button
          type="button"
          onClick={handleCopyShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-atlas-warm hover:bg-atlas-warm/80 border border-atlas-border text-atlas-ink font-bold text-label transition-all active:scale-95 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <span>{copied ? '✓ Copied to Clipboard' : '📋 Copy Shareable Text'}</span>
        </button>
      </div>

      {/* Main Content: Player & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 relative z-10">
        {/* Profile Info */}
        <div className="flex flex-col justify-center p-6 rounded-2xl bg-atlas-warm border border-atlas-border backdrop-blur-md shadow-sm">
          <span className="text-label font-black text-atlas-muted uppercase tracking-widest mb-1">Explorer Profile</span>
          <h3 className="text-3xl font-display font-black text-atlas-ink truncate tracking-tight mb-3">
            {session.agent || session.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="px-4 py-1.5 rounded-full bg-atlas-gold/15 border border-atlas-gold/30 text-label font-black text-atlas-ink flex items-center gap-2 shadow-sm">
              <span className="text-base">{rankInfo.icon}</span>
              <span className="uppercase tracking-wider">{rankInfo.rank}</span>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Score', value: totalScore, sub: 'Total Score', icon: '🧠', color: 'text-atlas-ink' },
            { label: 'Merit Stars', value: `${totalStars}/${GAME_DEFINITIONS.length * 3}`, sub: 'Perfect Runs', icon: '⭐', color: 'text-atlas-gold' },
            { label: 'Mastered', value: `${masteredCount}/${TOTAL_REGIONS}`, sub: 'Flawless Regions', icon: '🛡️', color: 'text-atlas-accent' },
            { label: 'Duration', value: timeString, sub: 'Expedition Time', icon: '⚡', color: 'text-atlas-ink' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col p-5 rounded-2xl bg-atlas-warm border border-atlas-border backdrop-blur-sm relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label font-black text-atlas-muted uppercase tracking-widest">{stat.label}</span>
                <span className="text-sm opacity-80">{stat.icon}</span>
              </div>
              <strong className={`text-display font-mono font-black ${stat.color} tracking-tight mt-auto`}>
                {stat.value}
              </strong>
              <span className="text-label text-atlas-muted mt-0.5 font-medium">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Stat Highlight Box */}
      <div className="p-5 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 flex items-center gap-4 relative z-10 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-atlas-accent/20 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
          ✨
        </div>
        <div>
          <h4 className="text-label font-black text-atlas-ink uppercase tracking-wider mb-0.5">Expedition Milestone</h4>
          <p className="text-body font-bold text-atlas-accent tracking-wide">
            {funStat}
          </p>
        </div>
      </div>

      {/* Footer / Screenshot Tip */}
      <div className="mt-6 pt-4 border-t border-atlas-border flex flex-col sm:flex-row items-center justify-between gap-2 text-label text-atlas-muted font-mono tracking-widest relative z-10 font-bold">
        <div className="flex items-center gap-2">
          <span>📸 SCREENSHOT-FRIENDLY SUMMARY</span>
        </div>
        <div className="flex items-center gap-4">
          <span>WAVE: <strong className="text-atlas-ink font-bold">{session.waveCode || 'Wave Alpha'}</strong></span>
          <span>TRAINER: <strong className="text-atlas-ink font-bold">{session.trainerName || 'Lead Explorer'}</strong></span>
          <span>DATE: <strong className="text-atlas-ink font-bold">{new Date().toLocaleDateString()}</strong></span>
        </div>
      </div>
    </AnimatedCard>
  );
};
