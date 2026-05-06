import React, { useEffect, useState } from 'react';
import { useAudio } from '@/hooks/useAudio';

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export default function Typewriter({ text, delay = 0.03, className = '', onComplete }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const { playSound } = useAudio();

  useEffect(() => {
    let currentIdx = 0;
    setDisplayedText('');
    setIsFinished(false);

    const interval = setInterval(() => {
      if (currentIdx < text.length) {
        setDisplayedText(text.slice(0, currentIdx + 1));
        if (text[currentIdx] !== ' ') {
          playSound('typewriter');
        }
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
        onComplete?.();
      }
    }, delay * 1000);

    return () => clearInterval(interval);
  }, [text, delay, playSound, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isFinished && <span className="animate-pulse opacity-50 ml-0.5">_</span>}
    </span>
  );
}
