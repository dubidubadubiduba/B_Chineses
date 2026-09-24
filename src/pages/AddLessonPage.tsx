import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { addLesson, bulkAddWords } from '../store';
import { todayStr } from '../utils/srs';
import { isLikelyValidSimplified } from '../utils/hanzi';

interface WordRow {
  simplified: string;
  pinyin: string;
  meaningKr: string;
  exampleCn: string;
  examplePinyin: string;
  exampleKr: string;
  tags: string;
}

function emptyRow(): WordRow {
  return { simplified: '', pinyin: '', meaningKr: '', exampleCn: '', examplePinyin: '', exampleKr: '', tags: '' };
}

export default function AddLessonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user!.uid;
  const [date, setDate] = useState(todayStr());
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<WordRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, patch: Partial<WordRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function parseRawTextToRows() {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const parsedRows = lines.map((line) => ({ ...emptyRow(), simplified: line }));
    setRows((prev) => {
      const isPrevEmpty = prev.every((r) => Object.values(r).every((v) => !v.trim()));
      return isPrevEmpty ? parsedRows : [...prev, ...parsedRows];
    });
  }

  async function handleSave() {
    const validRows = rows.filter((r) => r.simplified.trim() && r.meaningKr.trim());
    if (validRows.length === 0) {
      alert('최소 1개 이상의 단어(간체 + 뜻)를 입력해주세요.');
      return;
    }
    const badRows = validRows.filter((r) => !isLikelyValidSimplified(r.simplified));
    if (badRows.length > 0) {
      alert(
        `아래 항목은 간체 자리에 한글이 들어있거나 중국어가 아닌 것 같아요:\n\n${badRows
          .map((r) => `- ${r.simplified}`)
          .join('\n')}\n\n올바른 중국어 간체로 직접 고친 뒤 다시 저장해주세요.`,
      );
      return;
    }
    setSaving(true);
    try {
      const lessonId = await addLesson(uid, {
        date,
        title: title.trim() || undefined,
        rawText: rawText.trim() || undefined,
        createdAt: Date.now(),
      });
      const today = todayStr();
      await bulkAddWords(
        uid,
        validRows.map((r) => ({
          lessonId,
          simplified: r.simplified.trim(),
          pinyin: r.pinyin.trim(),
          meaningKr: r.meaningKr.trim(),
          exampleCn: r.exampleCn.trim() || undefined,
          examplePinyin: r.examplePinyin.trim() || undefined,
          exampleKr: r.exampleKr.trim() || undefined,
          tags: r.tags.trim() ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          srsBox: 0,
          nextReviewDate: today,
          createdAt: Date.now(),
        })),
      );
      navigate(`/lessons/${lessonId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold">새 수업 추가</h1>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="text-sm">
          수업 날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2"
          />
        </label>
        <label className="text-sm">
          수업 제목 (선택)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 여행 표현"
            className="mt-1 w-full rounded-lg border border-gray-300 p-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        선생님이 준 원본 텍스트 (선택, 참고용으로 그대로 저장)
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={5}
          placeholder="여기에 그대로 붙여넣기 하세요 (한 줄에 한 단어씩)"
          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
        />
      </label>
      <button
        type="button"
        onClick={parseRawTextToRows}
        disabled={!rawText.trim()}
        className="mb-4 mt-2 w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm text-red-600 disabled:opacity-40"
      >
        ↓ 위 텍스트 줄마다 단어 입력칸으로 자동 생성
      </button>

      <h2 className="mb-2 text-lg font-semibold">단어 입력</h2>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">단어 {i + 1}</span>
              <div className="flex items-center gap-2">
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="whitespace-nowrap text-xs text-gray-400"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="간체 (필수)"
                value={row.simplified}
                onChange={(e) => updateRow(i, { simplified: e.target.value })}
                className="rounded-lg border border-gray-300 p-2"
              />
              <input
                placeholder="병음"
                value={row.pinyin}
                onChange={(e) => updateRow(i, { pinyin: e.target.value })}
                className="rounded-lg border border-gray-300 p-2"
              />
            </div>
            <input
              placeholder="한국어 뜻 (필수)"
              value={row.meaningKr}
              onChange={(e) => updateRow(i, { meaningKr: e.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
            <input
              placeholder="HSK5 예문 (중국어)"
              value={row.exampleCn}
              onChange={(e) => updateRow(i, { exampleCn: e.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
            <input
              placeholder="예문 병음"
              value={row.examplePinyin}
              onChange={(e) => updateRow(i, { examplePinyin: e.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
            <input
              placeholder="예문 한국어 번역"
              value={row.exampleKr}
              onChange={(e) => updateRow(i, { exampleKr: e.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
            <input
              placeholder="태그 (쉼표로 구분, 예: 여행,동사)"
              value={row.tags}
              onChange={(e) => updateRow(i, { tags: e.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500"
      >
        + 단어 추가
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full rounded-xl bg-red-600 py-3 font-medium text-white shadow disabled:opacity-50"
      >
        {saving ? '저장 중...' : '수업 저장'}
      </button>
    </div>
  );
}
