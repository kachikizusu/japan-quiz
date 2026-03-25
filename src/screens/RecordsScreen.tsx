import { loadAllPersonalBests } from '../utils/personalBest';
import type { QuizType } from '../types';

interface Props {
  onBack: () => void;
}

const QUIZ_LABELS: Record<QuizType, string> = {
  name:     '都道府県と形',
  location: '位置クイズ',
  capital:  '県庁所在地',
  region:   '地方分類',
  shape:    '形クイズ',
  mark:     '県章クイズ',
};

const QUIZ_GRADIENTS: Record<string, string> = {
  name:     'from-blue-500 to-indigo-600',
  location: 'from-emerald-500 to-green-700',
  capital:  'from-violet-500 to-purple-700',
  region:   'from-cyan-500 to-teal-700',
};

const REGIONS_WITH_ALL = [
  '全国', '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄',
];
const REGIONS_NO_ALL = [
  '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄',
];

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}分${sec.toString().padStart(2, '0')}秒`;
  return `${s}秒`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function RecordsScreen({ onBack }: Props) {
  const allBests = loadAllPersonalBests();
  const quizTypes: QuizType[] = ['location', 'name', 'capital', 'region'];
  const hasRecords = Object.keys(allBests).length > 0;

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1b4b' }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <h2 className="text-xl font-black text-yellow-300" style={{ textShadow: '2px 2px 0 #92400e' }}>
          🏆 きろく
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {quizTypes.map(quizType => {
          const regionList = quizType === 'region'
            ? ['すべて']
            : quizType === 'name' || quizType === 'location'
            ? REGIONS_WITH_ALL
            : REGIONS_NO_ALL;

          const rows = regionList.map(region => {
            const key = `${quizType}-${region}`;
            return { region, pb: allBests[key] ?? null };
          }).filter(r => r.pb !== null);

          if (rows.length === 0) return null;

          return (
            <div key={quizType} className="rounded-2xl overflow-hidden border-2 border-blue-700"
              style={{ background: '#0e2a4d' }}>
              <div className={`bg-gradient-to-r ${QUIZ_GRADIENTS[quizType]} px-4 py-2.5`}>
                <span className="text-white font-black text-sm">{QUIZ_LABELS[quizType]}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-800 text-blue-400 text-xs">
                    <th className="text-left px-3 py-2">地方</th>
                    <th className="text-center px-1 py-2">正答率</th>
                    <th className="text-center px-1 py-2">秒数</th>
                    <th className="text-center px-1 py-2">全問クリア</th>
                    <th className="text-right px-3 py-2">日付</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ region, pb }) => {
                    const pct = Math.round((pb!.bestScore / pb!.totalCount) * 100);
                    const isPerfect = pb!.bestScore === pb!.totalCount;
                    const displayTime = pb!.bestTimeMs ?? pb!.perfectTimeMs;
                    return (
                      <tr key={region} className="border-b border-blue-900/50 last:border-0">
                        <td className="px-3 py-2.5 font-black text-white text-xs">{region}</td>
                        <td className="px-1 py-2.5 text-center">
                          <span className={`font-black text-sm ${isPerfect ? 'text-yellow-300' : 'text-blue-300'}`}>
                            {pct}%
                          </span>
                          <span className="block text-xs text-blue-500">
                            {pb!.bestScore}/{pb!.totalCount}
                          </span>
                        </td>
                        <td className="px-1 py-2.5 text-center">
                          {displayTime != null ? (
                            <span className="font-black text-white text-sm">{formatTime(displayTime)}</span>
                          ) : (
                            <span className="text-blue-700">—</span>
                          )}
                        </td>
                        <td className="px-1 py-2.5 text-center">
                          {pb!.perfectTimeMs != null ? (
                            <span className="font-black text-yellow-300 text-sm">
                              🏆 {formatTime(pb!.perfectTimeMs)}
                            </span>
                          ) : (
                            <span className="text-blue-700 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-blue-500 text-xs">
                          {formatDate(pb!.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {!hasRecords && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl opacity-50">🗾</div>
            <p className="font-black text-blue-300 text-lg">まだきろくがないよ！</p>
            <p className="text-sm text-blue-500 font-bold">クイズをクリアしてきろくをつくろう！</p>
          </div>
        )}
      </div>
    </div>
  );
}
