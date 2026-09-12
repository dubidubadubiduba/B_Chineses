import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Word } from '../types';
import PinyinText from './PinyinText';
import { speakChinese } from '../utils/tts';

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({
  word,
  onSwipe,
  isTop,
}: {
  word: Word;
  onSwipe: (result: 'know' | 'unknown') => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const knowOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const unknownOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('know');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('unknown');
    }
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
      style={isTop ? { x, rotate } : { scale: 0.96, top: 8 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={isTop ? undefined : { scale: 0.96 }}
    >
      {isTop && (
        <>
          <motion.span
            style={{ opacity: knowOpacity }}
            className="absolute left-4 top-4 rotate-[-10deg] rounded border-4 border-green-500 px-3 py-1 text-xl font-bold text-green-500"
          >
            안다
          </motion.span>
          <motion.span
            style={{ opacity: unknownOpacity }}
            className="absolute right-4 top-4 rotate-[10deg] rounded border-4 border-gray-400 px-3 py-1 text-xl font-bold text-gray-400"
          >
            모른다
          </motion.span>
        </>
      )}
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
      <span className="mt-4 text-lg text-gray-700">{word.meaningKr}</span>
    </motion.div>
  );
}
