import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db } from '../db';
import { nextSrsState, todayStr } from '../utils/srs';
import type { Word } from '../types';
import SwipeCard from '../components/SwipeCard';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TestPage() {
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId');
  const [dueOnly, setDueOnly] = useState(!lessonId);
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [results, setResults] = useState({ know: 0, unknown: 0 });

  const sourceWords = useLiveQuery(() => {
    if (lessonId) return db.words.where('lessonId').equals(Number(lessonId)).toArray();
    return db.words.toArray();
  }, [lessonId]);

  useEffect(() => {
    if (sourceWords && queue === null) {
      const list = dueOnly ? sourceWords.filter((w) => w.nextReviewDate <= todayStr()) : sourceWords;
      setQueue(shuffle(list));
    }
  }, [sourceWords, dueOnly, queue]);

  function restart() {
    setQueue(null);
    setResults({ know: 0, unknown: 0 });
  }

  async function handleSwipe(word: Word, result: 'know' | 'unknown') {
    const { box, nextReviewDate } = nextSrsState(word.srsBox, result);
    await db.words.update(word.id!, { srsBox: box, nextReviewDate });
    await db.reviewLogs.add({ wordId: word.id!, date: todayStr(), result });
    setResults((r) => ({ ...r, [result === 'know' ? 'know' : 'unknown']: r[result === 'know' ? 'know' : 'unknown'] + 1 }));
    setQueue((prev) => prev!.filter((w) => w.id !== word.id));
  }

  if (queue === null) {
    return <p className="p-8 text-center text-gray-400">불러오는 중...</p>;
  }

  return (
    <div className="flex h-full flex-col p-4 pb-24">
      <h1 className="mb-1 text-xl font-bold">스와이프 시험</h1>

      {!lessonId && (
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            checked={dueOnly}
            onChange={(e) => {
              setDueOnly(e.target.checked);
              setQueue(null);
            }}
          />
          오늘 복습 예정 단어만 보기
        </label>
      )}

      <p className="mb-3 text-sm text-gray-400">
        남은 단어 {queue.length}개 · 안다 {results.know} · 모른다 {results.unknown}
      </p>

      {queue.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-2xl">🎉 완료!</p>
          <p className="text-gray-500">
            안다 {results.know}개 · 모른다 {results.unknown}개
          </p>
          <button type="button" onClick={restart} className="rounded-xl bg-red-600 px-6 py-3 text-white">
            다시 시작
          </button>
        </div>
      ) : (
        <>
          <div className="relative h-96 w-full">
            {queue
              .slice(0, 2)
              .reverse()
              .map((w, i, arr) => (
                <SwipeCard
                  key={w.id}
                  word={w}
                  isTop={i === arr.length - 1}
                  onSwipe={(result) => handleSwipe(w, result)}
                />
              ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => handleSwipe(queue[0], 'unknown')}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-gray-600"
            >
              ✕ 모른다
            </button>
            <button
              type="button"
              onClick={() => handleSwipe(queue[0], 'know')}
              className="flex-1 rounded-xl bg-green-600 py-3 text-white"
            >
              ✓ 안다
            </button>
          </div>
        </>
      )}
    </div>
  );
}
