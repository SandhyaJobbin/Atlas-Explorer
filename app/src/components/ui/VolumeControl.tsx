import { useAudio } from '@/hooks/useAudio';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

export default function VolumeControl() {
  const { muted, toggleMute, volume, setVolume } = useAudio();

  return (
    <div className="flex items-center gap-2.5 bg-atlas-card px-3 py-1.5 rounded-2xl border border-atlas-border shadow-sm hover:border-atlas-border/80 transition-all">
      <button
        onClick={() => toggleMute()}
        className="text-atlas-muted hover:text-atlas-ink transition-colors flex items-center justify-center w-6 h-6 rounded-lg hover:bg-atlas-warm"
        title={muted ? 'Unmute audio' : 'Mute audio'}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      >
        {muted || volume === 0 ? (
          <VolumeX className="w-4 h-4 text-atlas-gold" />
        ) : volume < 0.5 ? (
          <Volume1 className="w-4 h-4 text-atlas-accent" />
        ) : (
          <Volume2 className="w-4 h-4 text-atlas-accent" />
        )}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : volume}
        onChange={(e) => {
          if (muted) toggleMute(false);
          setVolume(parseFloat(e.target.value));
        }}
        className="w-16 sm:w-20 h-1 bg-atlas-warm rounded-lg appearance-none cursor-pointer accent-atlas-accent focus:outline-none focus:ring-1 focus:ring-atlas-accent/50"
        aria-label="Master Volume"
        title={`Volume: ${muted ? 0 : Math.round(volume * 100)}%`}
      />

      <span className="text-xs font-mono font-bold text-atlas-muted min-w-[24px] text-right tabular-nums">
        {muted ? '0%' : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}
