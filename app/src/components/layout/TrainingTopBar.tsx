interface TrainingTopBarProps {
  explored: number;
  total: number;
  label: string;
  onExit?: () => void;
}

export default function TrainingTopBar({ explored, total, label, onExit }: TrainingTopBarProps) {
  const pct = Math.round((explored / total) * 100);

  return (
    <header className="bg-[#232F3E] text-white px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            onClick={onExit}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all group"
            title="Exit Training"
            aria-label="Exit Training"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        )}
        <span className="font-bold text-[#FF9900] tracking-wide text-sm uppercase">
          Atlas Explorer
        </span>
      </div>
      <span className="text-[#FEBD69] text-sm">{label}</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-white/70">
          {explored}/{total} explored
        </span>
        <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00A8A2] rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  );
}
