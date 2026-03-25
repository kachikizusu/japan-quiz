import type { QuizType } from '../types';

const REGIONS = [
  { name: '北海道',    emoji: '❄️',  gradient: 'from-sky-400 to-blue-500',      shadow: 'shadow-blue-900',    count: 1 },
  { name: '東北',      emoji: '🌸',  gradient: 'from-violet-400 to-purple-600', shadow: 'shadow-purple-900',  count: 6 },
  { name: '関東',      emoji: '🏙️', gradient: 'from-pink-400 to-rose-600',     shadow: 'shadow-rose-900',    count: 7 },
  { name: '中部',      emoji: '🗻',  gradient: 'from-amber-400 to-orange-500',  shadow: 'shadow-orange-900',  count: 9 },
  { name: '近畿',      emoji: '🦌',  gradient: 'from-orange-400 to-red-500',   shadow: 'shadow-red-900',     count: 7 },
  { name: '中国',      emoji: '⛩️', gradient: 'from-lime-400 to-green-600',   shadow: 'shadow-green-900',   count: 5 },
  { name: '四国',      emoji: '🍊',  gradient: 'from-cyan-400 to-teal-600',    shadow: 'shadow-teal-900',    count: 4 },
  { name: '九州・沖縄', emoji: '🌺', gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-green-900',   count: 8 },
];

const QUIZ_TYPE_LABEL: Record<QuizType, string> = {
  name:    '都道府県と形',
  capital: '県庁所在地クイズ',
  shape:   '形クイズ',
  mark:    '県章クイズ',
  region:  '地方分類クイズ',
};

interface Props {
  quizType: QuizType;
  onSelect: (region: string) => void;
  onBack: () => void;
}

export default function RegionSelectScreen({ quizType, onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1b4b' }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-blue-900 shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform">←</button>
        <div>
          <div className="text-xs text-blue-300 font-bold">{QUIZ_TYPE_LABEL[quizType]}</div>
          <h2 className="text-lg font-black text-white leading-tight">どの地方にする？</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {REGIONS.map(({ name, emoji, gradient, shadow, count }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`
              btn-3d flex flex-col items-center justify-center gap-1.5
              p-4 rounded-2xl border-2 border-white/25
              bg-gradient-to-br ${gradient} ${shadow}
              hover:brightness-110
            `}
          >
            <span className="text-3xl drop-shadow-lg">{emoji}</span>
            <span className="font-black text-white text-sm drop-shadow">{name}</span>
            <span className="text-xs text-white/75 font-bold">{count}都道府県</span>
          </button>
        ))}
      </div>
    </div>
  );
}
