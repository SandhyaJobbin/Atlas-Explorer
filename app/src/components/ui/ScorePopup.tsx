import { useEffect, useState } from 'react';

interface ScorePopupProps {
  x: number;
  y: number;
  score: number;
  onComplete: () => void;
}

export function ScorePopup({ x, y, score, onComplete }: ScorePopupProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
      onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!active) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none select-none font-black text-2xl text-[#FF9900] animate-score-float drop-shadow-[0_0_10px_rgba(255,153,0,0.5)]"
      style={{
        left: x,
        top: y,
      }}
    >
      +{score}
    </div>
  );
}

export function useScorePopups() {
  const [popups, setPopups] = useState<{ id: number; x: number; y: number; score: number }[]>([]);

  const triggerScore = (x: number, y: number, score: number) => {
    const id = Date.now();
    setPopups((prev) => [...prev, { id, x, y, score }]);
  };

  const removePopup = (id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  };

  const ScorePopups = () => (
    <>
      {popups.map((p) => (
        <ScorePopup
          key={p.id}
          x={p.x}
          y={p.y}
          score={p.score}
          onComplete={() => removePopup(p.id)}
        />
      ))}
    </>
  );

  return { triggerScore, ScorePopups };
}
