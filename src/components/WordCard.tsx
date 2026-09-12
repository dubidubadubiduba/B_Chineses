import { useState } from 'react';
import type { Word } from '../types';
import PinyinText from './PinyinText';
import { speakChinese } from '../utils/tts';

export default function WordCard({ word }: { word: Word }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative h-80 w-full cursor-pointer select-none [perspective:1200px]"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-md [backface-visibility:hidden]">
          <span className="text-6xl font-bold">{word.simplified}</span>
          <PinyinText pinyin={word.pinyin} className="text-2xl" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakChinese(word.simplified);
            }}
            className="mt-2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-600"
          >
            🔊 발음 듣기
          </button>
          <span className="absolute bottom-3 text-xs text-gray-400">탭해서 뜻 보기</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-md [backface-visibility:hidden]"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <span className="text-2xl font-semibold">{word.meaningKr}</span>
          {word.exampleCn && (
            <div className="mt-2 space-y-1">
              <p className="text-lg">{word.exampleCn}</p>
              {word.examplePinyin && (
                <PinyinText pinyin={word.examplePinyin} className="text-sm text-gray-500" />
              )}
              {word.exampleKr && <p className="text-sm text-gray-500">{word.exampleKr}</p>}
            </div>
          )}
          <span className="absolute bottom-3 text-xs text-gray-400">탭해서 단어 보기</span>
        </div>
      </div>
    </div>
  );
}
