interface GameTopBarProps {
  gameLabel: string;
  score: number;
  level: number;
  totalLevels: number;
}

export default function GameTopBar({ gameLabel, score, level, totalLevels }: GameTopBarProps) {
  return (
    <header className="bg-[#232F3E] text-white px-4 py-3 flex items-center gap-4">
      <span className="font-bold text-[#FF9900] tracking-wide text-sm uppercase">
        Atlas Explorer
      </span>
      <span className="text-[#FEBD69] text-sm">{gameLabel}</span>
      <div className="ml-auto flex items-center gap-6">
        <span className="text-sm text-white/70">
          Game {level}/{totalLevels}
        </span>
        <span className="text-sm font-semibold text-white">
          Score: <span className="text-[#FF9900]">{score}</span>
        </span>
      </div>
    </header>
  );
}
