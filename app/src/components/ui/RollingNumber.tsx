import { useEffect, useRef, useState } from 'react';

interface RollingNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function RollingNumber({ value, duration = 1000, className = '' }: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValueRef.current;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = Math.floor(easedProgress * (endValue - startValue) + startValue);
      displayValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        displayValueRef.current = endValue;
      }
    };

    const raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}
