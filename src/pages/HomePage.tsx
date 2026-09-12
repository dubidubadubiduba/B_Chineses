import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { todayStr } from '../utils/srs';

export default function HomePage() {
  const lessons = useLiveQuery(() => db.lessons.orderBy('date').reverse().toArray(), []);
  const totalWords = useLiveQuery(() => db.words.count(), []);
  const dueCount = useLiveQuery(
    () => db.words.where('nextReviewDate').belowOrEqual(todayStr()).count(),
    [],
  );
  const wordCounts = useLiveQuery(async () => {
    const words = await db.words.toArray();
    const map = new Map<number, number>();
    for (const w of words) map.set(w.lessonId, (map.get(w.lessonId) ?? 0) + 1);
    return map;
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">중국어 단어장</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-sm text-gray-500">오늘 복습할 단어</p>
          <p className="text-3xl font-bold text-red-600">{dueCount ?? 0}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">전체 단어 수</p>
          <p className="text-3xl font-bold">{totalWords ?? 0}</p>
        </div>
      </div>

      <Link
        to="/lessons/new"
        className="mb-4 block rounded-xl bg-red-600 py-3 text-center font-medium text-white shadow"
      >
        + 새 수업 추가
      </Link>

      <h2 className="mb-2 text-lg font-semibold">수업 목록</h2>
      <div className="space-y-2">
        {lessons?.length === 0 && (
          <p className="py-8 text-center text-gray-400">아직 등록된 수업이 없어요.</p>
        )}
        {lessons?.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lessons/${lesson.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
          >
            <div>
              <p className="font-medium">{lesson.title || lesson.date}</p>
              <p className="text-xs text-gray-400">{lesson.date}</p>
            </div>
            <span className="text-sm text-gray-500">
              {wordCounts?.get(lesson.id!) ?? 0}개 단어
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
