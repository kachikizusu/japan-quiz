interface TimerBarProps {
  remaining: number;
  total: number;
}

export default function TimerBar({ remaining, total }: TimerBarProps) {
  const pct = Math.max(0, (remaining / total) * 100);
  const urgent = remaining <= 5;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b border-blue-900"
      style={{ background: '#0a1638' }}>
      <span className={`text-sm font-black w-6 tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
        {remaining}
      </span>
      <div className="flex-1 h-3 rounded-full overflow-hidden border border-blue-800" style={{ background: '#1e3a5f' }}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            urgent
              ? 'bg-gradient-to-r from-red-500 to-red-400'
              : pct > 50
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500'
          }`}
          style={{
            width: `${pct}%`,
            boxShadow: urgent ? '0 0 8px rgba(239,68,68,0.8)' : undefined,
          }}
        />
      </div>
      <span className="text-xs text-blue-400 font-bold">秒</span>
    </div>
  );
}
