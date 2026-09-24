import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useWords } from '../store';
import { shuffle } from '../utils/shuffle';
import WordCard from '../components/WordCard';

type Order = 'sequential' | 'random';

export default function StudyPage() {
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId') ?? undefined;
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<Order>('sequential');
  const { user } = useAuth();

  const words = useWords(user!.uid, lessonId);

  const displayWords = useMemo(() => {
    if (!words) return null;
    return order === 'random' ? shuffle(words) : words;
  }, [words, order]);

  useEffect(() => {
    setIndex(0);
  }, [lessonId, order]);

  if (!displayWords) return null;

  if (displayWords.length === 0) {
    return <p className="p-8 text-center text-gray-400">학습할 단어가 없어요. 먼저 수업을 추가해주세요.</p>;
  }

  const clampedIndex = Math.min(index, displayWords.length - 1);
  const word = displayWords[clampedIndex];

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-1 text-xl font-bold">카드 학습</h1>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOrder('sequential')}
          className={`flex-1 rounded-lg py-1.5 text-sm ${
            order === 'sequential' ? 'bg-red-600 text-white' : 'border border-gray-300 text-gray-500'
          }`}
        >
          순서대로
        </button>
        <button
          type="button"
          onClick={() => setOrder('random')}
          className={`flex-1 rounded-lg py-1.5 text-sm ${
            order === 'random' ? 'bg-red-600 text-white' : 'border border-gray-300 text-gray-500'
          }`}
        >
          랜덤
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-400">
        {clampedIndex + 1} / {displayWords.length}
      </p>

      <WordCard key={word.id} word={word} />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={clampedIndex === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="flex-1 rounded-xl border border-gray-300 py-3 disabled:opacity-40"
        >
          ← 이전
        </button>
        <button
          type="button"
          disabled={clampedIndex === displayWords.length - 1}
          onClick={() => setIndex((i) => Math.min(displayWords.length - 1, i + 1))}
          className="flex-1 rounded-xl bg-red-600 py-3 text-white disabled:opacity-40"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
