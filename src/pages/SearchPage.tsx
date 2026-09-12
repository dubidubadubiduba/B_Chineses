import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import PinyinText from '../components/PinyinText';
import { speakChinese } from '../utils/tts';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [lessonFilter, setLessonFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const lessons = useLiveQuery(() => db.lessons.orderBy('date').reverse().toArray(), []);
  const words = useLiveQuery(() => db.words.toArray(), []);

  const lessonMap = useMemo(() => {
    const map = new Map<number, string>();
    lessons?.forEach((l) => map.set(l.id!, l.title || l.date));
    return map;
  }, [lessons]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    words?.forEach((w) => w.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [words]);

  const filtered = useMemo(() => {
    if (!words) return [];
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (lessonFilter && String(w.lessonId) !== lessonFilter) return false;
      if (tagFilter && !w.tags?.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        w.simplified.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaningKr.toLowerCase().includes(q)
      );
    });
  }, [words, query, lessonFilter, tagFilter]);

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold">단어 검색</h1>

      <input
        type="text"
        placeholder="간체, 병음, 뜻으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-lg border border-gray-300 p-2"
      />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <select
          value={lessonFilter}
          onChange={(e) => setLessonFilter(e.target.value)}
          className="rounded-lg border border-gray-300 p-2 text-sm"
        >
          <option value="">전체 수업</option>
          {lessons?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title || l.date}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-gray-300 p-2 text-sm"
        >
          <option value="">전체 태그</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-sm text-gray-400">{filtered.length}개 단어</p>

      <div className="space-y-2">
        {filtered.map((w) => (
          <div key={w.id} className="rounded-xl border border-gray-200 p-3">
            <div
              className="flex items-center justify-between"
              onClick={() => setExpandedId((id) => (id === w.id ? null : w.id!))}
            >
              <div>
                <p className="text-lg font-medium">
                  {w.simplified} <PinyinText pinyin={w.pinyin} className="text-sm text-gray-500" />
                </p>
                <p className="text-sm text-gray-600">{w.meaningKr}</p>
                <p className="text-xs text-gray-400">{lessonMap.get(w.lessonId)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakChinese(w.simplified);
                }}
                className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600"
              >
                🔊
              </button>
            </div>
            {expandedId === w.id && w.exampleCn && (
              <div className="mt-2 border-t border-gray-100 pt-2 text-sm text-gray-600">
                <p>{w.exampleCn}</p>
                {w.examplePinyin && <PinyinText pinyin={w.examplePinyin} className="text-gray-500" />}
                {w.exampleKr && <p className="text-gray-400">{w.exampleKr}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
