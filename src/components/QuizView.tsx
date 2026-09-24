import type { Word } from '../types';
import { speakChinese } from '../utils/tts';

export type QuizType = 'pinyin' | 'meaning' | 'hanzi';

export interface QuizOption {
  id: string;
  label: string;
}

export default function QuizView({
  word,
  quizType,
  options,
  selectedId,
  onSelect,
  onNext,
}: {
  word: Word;
  quizType: QuizType;
  options: QuizOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const answered = selectedId !== null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
        {quizType === 'hanzi' ? (
          <span className="text-center text-2xl font-semibold">{word.meaningKr}</span>
        ) : (
          <>
            <span className="text-6xl font-bold">{word.simplified}</span>
            <button
              type="button"
              onClick={() => speakChinese(word.simplified)}
              className="rounded-full bg-red-50 px-4 py-2 text-sm text-red-600"
            >
              🔊 발음 듣기
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const isCorrect = opt.id === word.id;
          const isSelected = opt.id === selectedId;
          let style = 'border border-gray-300 text-gray-700';
          if (answered && isCorrect) style = 'border-2 border-green-500 bg-green-50 text-green-700';
          else if (answered && isSelected && !isCorrect) style = 'border-2 border-red-400 bg-red-50 text-red-600';
          return (
            <button
              key={opt.id}
              type="button"
              disabled={answered}
              onClick={() => onSelect(opt.id)}
              className={`rounded-xl px-4 py-3 text-left text-lg ${style}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {answered && (
        <button type="button" onClick={onNext} className="mt-6 rounded-xl bg-red-600 py-3 text-white">
          다음 →
        </button>
      )}
    </div>
  );
}
