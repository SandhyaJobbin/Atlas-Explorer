import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { publicAsset } from '@/lib/assets';

type SoundName = 
  | 'correct'
  | 'wrong'
  | 'streak'
  | 'pass'
  | 'fail'
  | 'tick'
  | 'click'
  | 'star'
  | 'badge'
  | 'timer-warning'
  | 'typewriter'
  | 'milestone'
  | 'cluster';

interface FallbackTone {
  type: OscillatorType;
  notes: number[];
  duration: number;
  volume: number;
}

const SOUND_FILES: Record<SoundName, string> = {
  correct: '/sfx/Bright-chime.mp3',
  wrong: '/sfx/Low-thud.mp3',
  streak: '/sfx/Ascending-notes.mp3',
  pass: '/sfx/Celebratory-jingle.mp3',
  fail: '/sfx/Descending-notes.mp3',
  tick: '/sfx/Clock-tick.mp3',
  click: '/sfx/Soft-pop.mp3',
  star: '/sfx/Sparkle-ding.mp3',
  badge: '/sfx/Fanfare.mp3',
  'timer-warning': '/sfx/Timer-alert.mp3',
  typewriter: '/sfx/Typewriter.mp3',
  milestone: '/sfx/Celebratory-jingle.mp3',
  cluster: '/sfx/Bright-chime.mp3'
};

const FALLBACK_TONES: Record<SoundName, FallbackTone> = {
  correct: { type: 'triangle', notes: [659, 880], duration: 0.16, volume: 0.1 },
  wrong: { type: 'sawtooth', notes: [180, 130], duration: 0.22, volume: 0.08 },
  streak: { type: 'triangle', notes: [523, 659, 784], duration: 0.28, volume: 0.1 },
  pass: { type: 'triangle', notes: [523, 659, 784, 1046], duration: 0.48, volume: 0.12 },
  fail: { type: 'sine', notes: [392, 247], duration: 0.38, volume: 0.08 },
  tick: { type: 'square', notes: [880], duration: 0.055, volume: 0.045 },
  click: { type: 'triangle', notes: [420], duration: 0.045, volume: 0.035 },
  star: { type: 'sine', notes: [988, 1318], duration: 0.22, volume: 0.09 },
  badge: { type: 'triangle', notes: [659, 880, 1175], duration: 0.42, volume: 0.12 },
  'timer-warning': { type: 'square', notes: [440, 440], duration: 0.4, volume: 0.08 },
  typewriter: { type: 'square', notes: [600], duration: 0.02, volume: 0.02 },
  milestone: { type: 'triangle', notes: [523, 659, 784, 1046], duration: 0.48, volume: 0.12 },
  cluster: { type: 'triangle', notes: [523, 784], duration: 0.25, volume: 0.1 }
};

const STORAGE_KEY = 'atlas_audio_muted';
const VOLUME_KEY = 'atlas_audio_volume';

interface AudioContextType {
  muted: boolean;
  toggleMute: (force?: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
  playSound: (name: SoundName, streakCount?: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);
type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    }
    return false;
  });

  const [volume, setVolumeState] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(VOLUME_KEY);
      if (stored) return parseFloat(stored);
    }
    return 0.3; // Default 30% per D1 spec
  });

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VOLUME_KEY, clamped.toString());
    }
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferCache = useRef<Map<string, AudioBuffer>>(new Map());
  const unavailableSounds = useRef<Set<string>>(new Set());

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextConstructor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error('Web Audio API is not available in this browser.');
      }
      audioCtxRef.current = new AudioContextConstructor();
    }
    return audioCtxRef.current;
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer, ctx: AudioContext, baseVolume: number, streakCount?: number) => {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    
    const finalVolume = baseVolume * volume;
    gain.gain.setValueAtTime(finalVolume, ctx.currentTime);
    
    if (streakCount && streakCount > 1) {
      // Dynamic Web Audio API pitch escalation based on streak length
      const rate = 1 + Math.min(streakCount - 1, 10) * 0.08;
      source.playbackRate.setValueAtTime(rate, ctx.currentTime);
    }

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }, [volume]);

  const playFallbackTone = useCallback((name: SoundName, ctx: AudioContext, streakCount?: number) => {
    const tone = FALLBACK_TONES[name];
    if (!tone) return;

    const pitchMultiplier = (name === 'streak' && streakCount && streakCount > 1) 
      ? 1 + Math.min(streakCount - 1, 10) * 0.08 
      : 1;

    const step = Math.max(tone.duration / Math.max(tone.notes.length, 1), 0.045);
    tone.notes.forEach((baseFreq, index) => {
      const frequency = baseFreq * pitchMultiplier;
      const start = ctx.currentTime + index * step;
      const stop = start + step * 0.92;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = tone.type;
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(tone.volume * volume * 2.5, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, stop);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(stop + 0.02);
    });
  }, [volume]);

  const gainFor = (name: SoundName): number => {
    const gains: Record<string, number> = {
      tick: 0.12,
      click: 0.18,
      wrong: 0.32,
      correct: 0.38,
      streak: 0.42,
      star: 0.4,
      pass: 0.46,
      fail: 0.34,
      badge: 0.5,
      'timer-warning': 0.4,
      typewriter: 0.08,
      milestone: 0.45,
      cluster: 0.35
    };
    return gains[name] || 0.36;
  };

  const playSound = useCallback(async (name: SoundName, streakCount?: number) => {
    if (muted || volume <= 0) return;
    const ctx = getAudioContext();
    
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (!unavailableSounds.current.has(name)) {
        let buffer = bufferCache.current.get(name);
        if (!buffer) {
          const path = SOUND_FILES[name];
          const response = await fetch(publicAsset(path));
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            buffer = await ctx.decodeAudioData(arrayBuffer);
            bufferCache.current.set(name, buffer);
          } else {
            unavailableSounds.current.add(name);
          }
        }

        if (buffer) {
          playBuffer(buffer, ctx, gainFor(name), streakCount);
          return;
        }
      }
    } catch (error) {
      console.warn(`Failed to play sound: ${name}`, error);
      unavailableSounds.current.add(name);
    }

    playFallbackTone(name, ctx, streakCount);
  }, [muted, volume, getAudioContext, playBuffer, playFallbackTone]);

  const toggleMute = useCallback((force?: boolean) => {
    setMuted(prev => {
      const next = typeof force === 'boolean' ? force : !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [getAudioContext]);

  return (
    <AudioContext.Provider value={{ muted, toggleMute, volume, setVolume, playSound }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
