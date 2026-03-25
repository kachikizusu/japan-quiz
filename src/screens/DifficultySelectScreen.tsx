interface Props {
  region: string;
  onSelect: (challenge: boolean) => void;
  onBack: () => void;
}

export default function DifficultySelectScreen({ region, onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1b4b' }}>
      <header
        className="flex items-center gap-3 px-4 py-3 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}
      >
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform">←</button>
        <div>
          <div className="text-xs text-blue-300 font-bold">都道府県と形・{region}</div>
          <h2 className="text-lg font-black text-white">難易度を選ぼう！</h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-blue-300 font-bold text-sm">どっちのモードでチャレンジする？</p>

        {/* ふつう */}
        <button
          onClick={() => onSelect(false)}
          className="btn-3d w-full max-w-xs rounded-2xl border-2 border-blue-400 overflow-hidden text-left hover:brightness-110"
          style={{ background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)', boxShadow: '0 6px 0 #1e3a8a' }}
        >
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🗾</span>
              <div>
                <div className="font-black text-xl text-white">ふつう</div>
                <div className="text-xs text-blue-300 font-bold">NORMAL</div>
              </div>
            </div>
            <p className="text-sm text-blue-200">
              都道府県の境界線が見えるよ。<br />まずはここから挑戦しよう！
            </p>
          </div>
        </button>

        {/* チャレンジ */}
        <button
          onClick={() => onSelect(true)}
          className="btn-3d w-full max-w-xs rounded-2xl border-2 border-yellow-400 overflow-hidden text-left hover:brightness-110"
          style={{ background: 'linear-gradient(to bottom, #78350f, #92400e)', boxShadow: '0 6px 0 #451a03' }}
        >
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🔥</span>
              <div>
                <div className="font-black text-xl text-yellow-300">チャレンジ</div>
                <div className="text-xs text-yellow-600 font-bold">CHALLENGE</div>
              </div>
            </div>
            <p className="text-sm text-yellow-200">
              境界線なし！白地図に正しい場所を<br />見つけよう。本当の実力試し！
            </p>
            <div className="mt-2 inline-block bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full">
              🏆 記録対象
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
