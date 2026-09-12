import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db } from '../db';
import WordCard from '../components/WordCard';

export default function StudyPage() {
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId');
  const [index, setIndex] = useState(0);

  const words = useLiveQuery(() => {
    if (lessonId) return db.words.where('lessonId').equals(Number(lessonId)).toArray();
    return db.words.toArray();
  }, [lessonId]);

  if (!words) return null;

  if (words.length === 0) {
    return <p className="p-8 text-center text-gray-400">학습할 단어가 없어요. 먼저 수업을 추가해주세요.</p>;
  }

  const clampedIndex = Math.min(index, words.length - 1);
  const word = words[clampedIndex];

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-1 text-xl font-bold">카드 학습</h1>
      <p className="mb-4 text-sm text-gray-400">
        {clampedIndex + 1} / {words.length}
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
          disabled={clampedIndex === words.length - 1}
          onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
          className="flex-1 rounded-xl bg-red-600 py-3 text-white disabled:opacity-40"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
