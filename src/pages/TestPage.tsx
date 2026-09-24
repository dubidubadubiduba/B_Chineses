import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { addReviewLog, updateWord, useLessons, useWords } from '../store';
import { nextSrsState, todayStr } from '../utils/srs';
import { shuffle } from '../utils/shuffle';
import type { Word } from '../types';
import SwipeCard from '../components/SwipeCard';
import QuizView, { type QuizType } from '../components/QuizView';

type Mode = 'swipe' | 'quiz';

export default function TestPage() {
  const [params] = useSearchParams();
  const initialLessonId = params.get('lessonId') ?? '';
  const [lessonFilter, setLessonFilter] = useState(initialLessonId);
  const [dueOnly, setDueOnly] = useState(!initialLessonId);
  const [mode, setMode] = useState<Mode>('swipe');
  const [quizType, setQuizType] = useState<QuizType>('pinyin');
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [results, setResults] = useState({ know: 0, unknown: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuth();
  const uid = user!.uid;

  const lessons = useLessons(uid);
  const sourceWords = useWords(uid, lessonFilter || undefined);

  useEffect(() => {
    if (sourceWords && queue === null) {
      const list = dueOnly ? sourceWords.filter((w) => w.nextReviewDate <= todayStr()) : sourceWords;
      setQueue(shuffle(list));
    }
  }, [sourceWords, dueOnly, queue]);

  function restart() {
    setQueue(null);
    setResults({ know: 0, unknown: 0 });
    setSelectedId(null);
  }

  function switchMode(m: Mode) {
    setMode(m);
    restart();
  }

  function switchQuizType(t: QuizType) {
    setQuizType(t);
    restart();
  }

  function handleLessonFilterChange(value: string) {
    setLessonFilter(value);
    restart();
  }

  async function recordAnswer(word: Word, correct: boolean) {
    const { box, nextReviewDate } = nextSrsState(word.srsBox, correct ? 'know' : 'unknown');
    await updateWord(uid, word.id!, { srsBox: box, nextReviewDate });
    await addReviewLog(uid, { wordId: word.id!, date: todayStr(), result: correct ? 'know' : 'unknown' });
    setResults((r) => (correct ? { ...r, know: r.know + 1 } : { ...r, unknown: r.unknown + 1 }));
  }

  async function handleSwipe(word: Word, result: 'know' | 'unknown') {
    await recordAnswer(word, result === 'know');
    setQueue((prev) => prev!.filter((w) => w.id !== word.id));
  }

  const quizOptions = useMemo(() => {
    if (mode !== 'quiz' || !queue || queue.length === 0 || !sourceWords) return null;
    const current = queue[0];
    const pool = sourceWords.filter((w) => w.id !== current.id);
    const distractors = shuffle(pool).slice(0, Math.min(3, pool.length));
    const all = shuffle([current, ...distractors]);
    const labelFor = (w: Word) =>
      quizType === 'pinyin' ? w.pinyin : quizType === 'meaning' ? w.meaningKr : `${w.simplified} (${w.pinyin})`;
    return all.map((w) => ({ id: w.id!, label: labelFor(w) }));
  }, [mode, queue, sourceWords, quizType]);

  async function handleQuizSelect(optionId: string) {
    if (selectedId !== null || !queue) return;
    setSelectedId(optionId);
    await recordAnswer(queue[0], optionId === queue[0].id);
  }

  function handleQuizNext() {
    setSelectedId(null);
    setQueue((prev) => prev!.slice(1));
  }

  if (queue === null) {
    return <p className="p-8 text-center text-gray-400">불러오는 중...</p>;
  }

  return (
    <div className="flex h-full flex-col p-4 pb-24">
      <h1 className="mb-1 text-xl font-bold">시험</h1>

      <select
        value={lessonFilter}
        onChange={(e) => handleLessonFilterChange(e.target.value)}
        className="mb-2 w-full rounded-lg border border-gray-300 p-2 text-sm"
      >
        <option value="">전체 (모든 수업 랜덤)</option>
        {lessons?.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title || l.date}
          </option>
        ))}
      </select>

      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => switchMode('swipe')}
          className={`flex-1 rounded-lg py-1.5 text-sm ${
            mode === 'swipe' ? 'bg-red-600 text-white' : 'border border-gray-300 text-gray-500'
          }`}
        >
          스와이프
        </button>
        <button
          type="button"
          onClick={() => switchMode('quiz')}
          className={`flex-1 rounded-lg py-1.5 text-sm ${
            mode === 'quiz' ? 'bg-red-600 text-white' : 'border border-gray-300 text-gray-500'
          }`}
        >
          객관식
        </button>
      </div>

      {mode === 'quiz' && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => switchQuizType('pinyin')}
            className={`rounded-lg py-1.5 text-xs ${
              quizType === 'pinyin' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-500'
            }`}
          >
            간체→병음
          </button>
          <button
            type="button"
            onClick={() => switchQuizType('meaning')}
            className={`rounded-lg py-1.5 text-xs ${
              quizType === 'meaning' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-500'
            }`}
          >
            간체→뜻
          </button>
          <button
            type="button"
            onClick={() => switchQuizType('hanzi')}
            className={`rounded-lg py-1.5 text-xs ${
              quizType === 'hanzi' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-500'
            }`}
          >
            뜻→간체·병음
          </button>
        </div>
      )}

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
      ) : mode === 'swipe' ? (
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
      ) : (
        <QuizView
          word={queue[0]}
          quizType={quizType}
          options={quizOptions ?? []}
          selectedId={selectedId}
          onSelect={handleQuizSelect}
          onNext={handleQuizNext}
        />
      )}
    </div>
  );
}
