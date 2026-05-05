interface GameTopBarProps {
  gameLabel: string;
  score: number;
  level: number;
  totalLevels: number;
  attemptNumber?: number;
  onExit?: () => void;
}

export default function GameTopBar({ 
  gameLabel, 
  score, 
  level, 
  totalLevels, 
  attemptNumber,
  onExit
}: GameTopBarProps) {
  return (
    <header className="bg-[#232F3E] text-white px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            onClick={onExit}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all group"
            title="Exit Game"
            aria-label="Exit Game"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        )}
        <span className="font-bold text-[#FF9900] tracking-wide text-sm uppercase">
          Atlas Explorer
        </span>
      </div>
      <span className="text-[#FEBD69] text-sm">{gameLabel}</span>
      <div className="ml-auto flex items-center gap-6">
        <span className="text-sm text-white/70">
          Game {level}/{totalLevels}
          {attemptNumber && attemptNumber > 1 && (
            <span className="ml-1 text-xs opacity-60 font-mono font-bold uppercase tracking-tighter">
              (Attempt {attemptNumber})
            </span>
          )}
        </span>
        <span className="text-sm font-semibold text-white">
          Score: <span className="text-[#FF9900]">{score}</span>
        </span>
      </div>
    </header>
  );
}
