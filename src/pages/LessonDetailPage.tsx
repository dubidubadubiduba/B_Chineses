import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import PinyinText from '../components/PinyinText';

export default function LessonDetailPage() {
  const { id } = useParams();
  const lessonId = Number(id);
  const navigate = useNavigate();

  const lesson = useLiveQuery(() => db.lessons.get(lessonId), [lessonId]);
  const words = useLiveQuery(
    () => db.words.where('lessonId').equals(lessonId).toArray(),
    [lessonId],
  );

  async function handleDeleteWord(wordId: number) {
    if (!confirm('이 단어를 삭제할까요?')) return;
    await db.words.delete(wordId);
  }

  async function handleDeleteLesson() {
    if (!confirm('이 수업과 포함된 모든 단어를 삭제할까요?')) return;
    await db.words.where('lessonId').equals(lessonId).delete();
    await db.lessons.delete(lessonId);
    navigate('/');
  }

  if (!lesson) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold">{lesson.title || lesson.date}</h1>
      <p className="mb-4 text-sm text-gray-400">{lesson.date}</p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          to={`/study?lessonId=${lessonId}`}
          className="rounded-xl bg-red-600 py-2 text-center text-sm font-medium text-white"
        >
          📖 이 수업 학습
        </Link>
        <Link
          to={`/test?lessonId=${lessonId}`}
          className="rounded-xl bg-gray-800 py-2 text-center text-sm font-medium text-white"
        >
          🔀 이 수업 시험
        </Link>
      </div>

      <h2 className="mb-2 text-lg font-semibold">단어 ({words?.length ?? 0})</h2>
      <div className="space-y-2">
        {words?.map((w) => (
          <div key={w.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
            <div>
              <p className="text-lg font-medium">
                {w.simplified} <PinyinText pinyin={w.pinyin} className="text-sm text-gray-500" />
              </p>
              <p className="text-sm text-gray-600">{w.meaningKr}</p>
            </div>
            <button type="button" onClick={() => handleDeleteWord(w.id!)} className="text-xs text-red-500">
              삭제
            </button>
          </div>
        ))}
      </div>

      {lesson.rawText && (
        <details className="mt-4 text-sm text-gray-500">
          <summary>원본 텍스트 보기</summary>
          <p className="mt-2 whitespace-pre-wrap">{lesson.rawText}</p>
        </details>
      )}

      <button
        type="button"
        onClick={handleDeleteLesson}
        className="mt-6 w-full rounded-xl border border-red-200 py-2 text-sm text-red-500"
      >
        수업 삭제
      </button>
    </div>
  );
}
