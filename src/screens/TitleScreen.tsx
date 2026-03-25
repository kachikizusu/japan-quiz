interface TitleScreenProps {
  onStart: () => void;
  onRecords: () => void;
}

export default function TitleScreen({ onStart, onRecords }: TitleScreenProps) {
  return (
    <div className="relative starfield flex flex-col items-center justify-center h-full px-6 text-white overflow-hidden">

      {/* ロゴエリア */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <div className="text-8xl mb-3 drop-shadow-[0_4px_16px_rgba(250,204,21,0.8)] animate-bounce" style={{ animationDuration: '2s' }}>
          🗾
        </div>
        <div className="relative">
            <h1
            className="text-2xl font-black text-yellow-300 text-center leading-snug"
            style={{ textShadow: '2px 2px 0 #92400e, -1px -1px 0 #b45309' }}
          >
            今日から君も
          </h1>
          <h1
            className="text-3xl font-black text-yellow-300 text-center leading-snug"
            style={{ textShadow: '3px 3px 0 #92400e, -1px -1px 0 #b45309' }}
          >
            都道府県マスター
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg">⭐</span>
          <p className="text-blue-200 text-sm font-bold">日本の47都道府県をマスターしよう！</p>
          <span className="text-lg">⭐</span>
        </div>
      </div>

      {/* ボタン */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
        <button
          className="
            btn-3d w-full py-5 rounded-2xl font-black text-2xl
            bg-gradient-to-b from-yellow-300 to-yellow-500
            text-yellow-900 border-2 border-yellow-200
            shadow-yellow-800 hover:brightness-110
          "
          onClick={onStart}
        >
          🎮 はじめる！
        </button>
        <button
          className="
            btn-3d w-full py-3 rounded-xl font-bold text-base
            bg-gradient-to-b from-indigo-400 to-indigo-600
            text-white border-2 border-indigo-300
            shadow-indigo-900 hover:brightness-110
          "
          onClick={onRecords}
        >
          🏆 きろくを見る
        </button>
      </div>

      <p className="relative z-10 mt-8 text-xs text-blue-400 opacity-70">小学4年生以上向け</p>
    </div>
  );
}
