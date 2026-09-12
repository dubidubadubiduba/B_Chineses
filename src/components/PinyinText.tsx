import { splitPinyinSyllables, TONE_COLORS } from '../utils/pinyinTone';

export default function PinyinText({
  pinyin,
  className = '',
}: {
  pinyin: string;
  className?: string;
}) {
  const syllables = splitPinyinSyllables(pinyin);
  return (
    <span className={className}>
      {syllables.map((s, i) => (
        <span key={i} style={{ color: TONE_COLORS[s.tone] }}>
          {s.text}
          {i < syllables.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
