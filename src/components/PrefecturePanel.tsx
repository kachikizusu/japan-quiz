import type { Prefecture } from '../types';

interface PrefecturePanelProps {
  remaining: Prefecture[];
  draggingCode: string | null;
  onDragStart: (code: string, e: React.PointerEvent) => void;
}

export default function PrefecturePanel({
  remaining,
  draggingCode,
  onDragStart,
}: PrefecturePanelProps) {
  if (remaining.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-green-600 font-bold text-lg">
        🎉 全部完成！
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-row flex-wrap gap-2 p-3 overflow-y-auto
        bg-white border-t border-slate-200
        md:flex-col md:w-48 md:border-t-0 md:border-l md:min-h-0 md:max-h-full
        shrink-0
      "
      style={{ maxHeight: '40vh' }}
    >
      <p className="w-full text-xs text-slate-400 mb-1 hidden md:block">
        ドラッグして地図に置こう
      </p>
      {remaining.map((pref) => {
        const isBeingDragged = draggingCode === pref.code;
        return (
          <div
            key={pref.code}
            data-drag-code={pref.code}
            className={`
              prefecture-label
              flex items-center gap-1 px-2 py-1.5 rounded-lg
              border-2 border-slate-300 cursor-grab active:cursor-grabbing
              text-sm font-bold select-none touch-none
              transition-opacity duration-150
              ${pref.color}
              ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
            `}
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onDragStart(pref.code, e);
            }}
          >
            <span className="text-base leading-none">{pref.name}</span>
            <span className="text-xs text-slate-500 leading-none hidden md:inline">
              {pref.nameKana}
            </span>
          </div>
        );
      })}
    </div>
  );
}
