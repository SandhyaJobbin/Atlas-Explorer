import { Flame, Zap } from 'lucide-react';

interface StreakMeterProps {
  streak: number;
  tone?: 'light' | 'dark';
}

interface StreakEdgeEffectsProps {
  streak: number;
  sweepKey?: number;
}

function getStreakTier(streak: number) {
  if (streak >= 8) return 'sweep';
  if (streak >= 5) return 'vignette';
  if (streak >= 3) return 'ring';
  return 'base';
}

export function StreakMeter({ streak, tone = 'dark' }: StreakMeterProps) {
  const tier = getStreakTier(streak);
  const isHot = streak >= 5;
  const iconClass = isHot ? 'text-atlas-gold' : tone === 'light' ? 'text-atlas-ink/70' : 'text-atlas-warm/70';
  const valueClass = tone === 'light' ? 'text-atlas-ink' : 'text-atlas-warm';

  return (
    <div
      className={[
        'streak-meter',
        `streak-meter--${tier}`,
        tone === 'light' ? 'streak-meter--light' : 'streak-meter--dark',
      ].join(' ')}
      aria-label={`${streak} answer streak`}
    >
      <span className="streak-meter__icon" aria-hidden="true">
        {isHot ? (
          <Flame className={`h-4 w-4 ${iconClass}`} strokeWidth={2.5} />
        ) : (
          <Zap className={`h-4 w-4 ${iconClass}`} strokeWidth={2.5} />
        )}
      </span>
      <strong className={`font-mono font-black leading-none tabular-nums ${valueClass}`}>
        {streak}x
      </strong>
    </div>
  );
}

export function StreakEdgeEffects({ streak, sweepKey = 0 }: StreakEdgeEffectsProps) {
  return (
    <>
      <div className={`streak-edge-vignette ${streak >= 5 ? 'is-active' : ''}`} aria-hidden="true" />
      {streak >= 8 && sweepKey > 0 && (
        <div key={sweepKey} className="streak-edge-sweep" aria-hidden="true" />
      )}
    </>
  );
}
