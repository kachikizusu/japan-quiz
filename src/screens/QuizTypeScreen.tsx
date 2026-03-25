import type { QuizType } from '../types';

const QUIZ_TYPES: {
  type: QuizType;
  label: string;
  emoji: string;
  desc: string;
  available: boolean;
  gradient: string;
  shadow: string;
}[] = [
  { type: 'name',    label: '都道府県と形', emoji: '🔷', desc: '形のシルエットを地図にはめよう',   available: true,  gradient: 'from-blue-400 to-indigo-500',   shadow: 'shadow-indigo-800' },
  { type: 'capital', label: '県庁所在地', emoji: '🏛️', desc: '県庁所在地をひらがな・漢字で入力', available: true,  gradient: 'from-violet-400 to-purple-600',  shadow: 'shadow-purple-900' },
  { type: 'region',  label: '地方分類',   emoji: '🗺️', desc: '47都道府県の地方をボタンで選ぼう', available: true,  gradient: 'from-cyan-400 to-teal-500',      shadow: 'shadow-teal-900' },
  { type: 'shape',   label: '形クイズ2', emoji: '🔷', desc: '形のピースをはめよう',              available: false, gradient: 'from-gray-500 to-gray-600',      shadow: 'shadow-gray-900' },
  { type: 'mark',    label: '県章クイズ', emoji: '🏅', desc: '県章のピースをはめよう',            available: false, gradient: 'from-gray-500 to-gray-600',      shadow: 'shadow-gray-900' },
];

interface Props {
  onSelect: (type: QuizType) => void;
  onBack: () => void;
}

export default function QuizTypeScreen({ onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1b4b' }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-blue-900 shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <h2 className="text-lg font-black text-white">どのクイズにする？</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {QUIZ_TYPES.map(({ type, label, emoji, desc, available, gradient, shadow }) => (
          <button
            key={type}
            disabled={!available}
            onClick={() => onSelect(type)}
            className={`
              btn-3d flex items-center gap-4 p-4 rounded-2xl text-left w-full
              border-2 border-white/20
              bg-gradient-to-r ${gradient} ${shadow}
              ${available ? 'hover:brightness-110 active:brightness-90' : 'opacity-40 cursor-not-allowed'}
            `}
          >
            <span className="text-4xl leading-none drop-shadow">{emoji}</span>
            <div className="flex-1">
              <div className="font-black text-white text-lg drop-shadow">{label}</div>
              <div className="text-sm text-white/70 mt-0.5">{desc}</div>
              {!available && (
                <span className="inline-block mt-1 text-xs bg-black/30 text-white/60 px-2 py-0.5 rounded-full">
                  じゅんびちゅう
                </span>
              )}
            </div>
            {available && <span className="text-white/80 text-2xl font-black">›</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
