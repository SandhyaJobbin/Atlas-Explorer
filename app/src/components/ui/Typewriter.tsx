import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
}

export default function Typewriter({ text, delay = 0.03, className = '' }: TypewriterProps) {
  const [visibleText, setVisibleText] = useState(text);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timeout = window.setTimeout(() => setVisibleText(text), 0);
      return () => window.clearTimeout(timeout);
    }

    const reset = window.setTimeout(() => setVisibleText(''), 0);
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, Math.max(10, delay * 1000));

    return () => {
      window.clearTimeout(reset);
      window.clearInterval(interval);
    };
  }, [delay, text]);

  return <span className={className}>{visibleText}</span>;
}
