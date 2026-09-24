import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { deleteLesson, deleteWord, useLesson, updateWord, useWords } from '../store';
import PinyinText from '../components/PinyinText';
import { isLikelyValidSimplified } from '../utils/hanzi';
import { fetchWordInfo } from '../utils/aiWordInfo';
import type { Word } from '../types';

interface EditDraft {
  simplified: string;
  pinyin: string;
  meaningKr: string;
  exampleCn: string;
  examplePinyin: string;
  exampleKr: string;
  tags: string;
}

function toDraft(w: Word): EditDraft {
  return {
    simplified: w.simplified,
    pinyin: w.pinyin,
    meaningKr: w.meaningKr,
    exampleCn: w.exampleCn ?? '',
    examplePinyin: w.examplePinyin ?? '',
    exampleKr: w.exampleKr ?? '',
    tags: w.tags?.join(', ') ?? '',
  };
}

export default function LessonDetailPage() {
  const { id } = useParams();
  const lessonId = id!;
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user!.uid;

  const lesson = useLesson(uid, lessonId);
  const words = useWords(uid, lessonId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  function startEdit(w: Word) {
    setEditingId(w.id!);
    setDraft(toDraft(w));
    setAiError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setAiError('');
  }

  async function handleAiRegenerate() {
    if (!draft) return;
    setAiError('');
    setAiLoading(true);
    try {
      const info = await fetchWordInfo(draft.simplified.trim());
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              simplified: info.simplified || prev.simplified,
              pinyin: info.pinyin || prev.pinyin,
              meaningKr: info.meaningKr || prev.meaningKr,
              exampleCn: info.exampleCn || prev.exampleCn,
              examplePinyin: info.examplePinyin || prev.examplePinyin,
              exampleKr: info.exampleKr || prev.exampleKr,
            }
          : prev,
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!draft || editingId === null) return;
    if (!draft.simplified.trim() || !draft.meaningKr.trim()) {
      setAiError('간체와 뜻은 반드시 입력해야 합니다.');
      return;
    }
    if (!isLikelyValidSimplified(draft.simplified)) {
      setAiError('간체 자리에 한글이 들어있는 것 같아요. "AI로 재생성"을 눌러 올바른 간체로 고쳐주세요.');
      return;
    }
    await updateWord(uid, editingId, {
      simplified: draft.simplified.trim(),
      pinyin: draft.pinyin.trim(),
      meaningKr: draft.meaningKr.trim(),
      exampleCn: draft.exampleCn.trim() || undefined,
      examplePinyin: draft.examplePinyin.trim() || undefined,
      exampleKr: draft.exampleKr.trim() || undefined,
      tags: draft.tags.trim() ? draft.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
    cancelEdit();
  }

  async function handleDeleteWord(wordId: string) {
    if (!confirm('이 단어를 삭제할까요?')) return;
    await deleteWord(uid, wordId);
  }

  async function handleDeleteLesson() {
    if (!confirm('이 수업과 포함된 모든 단어를 삭제할까요?')) return;
    await deleteLesson(uid, lessonId);
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
        {words?.map((w) => {
          const isBad = !isLikelyValidSimplified(w.simplified);
          const isEditing = editingId === w.id;
          return (
            <div
              key={w.id}
              className={`rounded-xl border p-3 ${isBad ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            >
              {!isEditing ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium">
                      {w.simplified} <PinyinText pinyin={w.pinyin} className="text-sm text-gray-500" />
                    </p>
                    <p className="text-sm text-gray-600">{w.meaningKr}</p>
                    {isBad && <p className="text-xs text-red-500">⚠ 간체 자리에 한글이 있는 것 같아요</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEdit(w)} className="text-xs text-red-600">
                      수정
                    </button>
                    <button type="button" onClick={() => handleDeleteWord(w.id!)} className="text-xs text-gray-400">
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {aiError && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{aiError}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="간체"
                      value={draft?.simplified ?? ''}
                      onChange={(e) => setDraft((d) => (d ? { ...d, simplified: e.target.value } : d))}
                      className="rounded-lg border border-gray-300 p-2"
                    />
                    <input
                      placeholder="병음"
                      value={draft?.pinyin ?? ''}
                      onChange={(e) => setDraft((d) => (d ? { ...d, pinyin: e.target.value } : d))}
                      className="rounded-lg border border-gray-300 p-2"
                    />
                  </div>
                  <input
                    placeholder="한국어 뜻"
                    value={draft?.meaningKr ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, meaningKr: e.target.value } : d))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <input
                    placeholder="HSK5 예문 (중국어)"
                    value={draft?.exampleCn ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, exampleCn: e.target.value } : d))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <input
                    placeholder="예문 병음"
                    value={draft?.examplePinyin ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, examplePinyin: e.target.value } : d))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <input
                    placeholder="예문 한국어 번역"
                    value={draft?.exampleKr ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, exampleKr: e.target.value } : d))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <input
                    placeholder="태그 (쉼표로 구분)"
                    value={draft?.tags ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, tags: e.target.value } : d))}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAiRegenerate}
                      disabled={aiLoading || !draft?.simplified.trim()}
                      className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {aiLoading ? '🤖 생성 중...' : '🤖 AI로 재생성'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 rounded-lg bg-gray-800 py-2 text-xs font-medium text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 rounded-lg border border-gray-300 py-2 text-xs text-gray-500"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
