const TONE_MARKS: Record<number, string> = {
  1: 'āēīōūǖĀĒĪŌŪǕ',
  2: 'áéíóúǘÁÉÍÓÚǗ',
  3: 'ǎěǐǒǔǚǍĚǏǑǔǚ',
  4: 'àèìòùǜÀÈÌÒÙǛ',
};

export const TONE_COLORS: Record<number, string> = {
  1: '#e53935', // red
  2: '#f59e0b', // orange
  3: '#43a047', // green
  4: '#1e88e5', // blue
  5: '#6b7280', // neutral gray
};

export function toneOfSyllable(syllable: string): number {
  for (const [tone, chars] of Object.entries(TONE_MARKS)) {
    for (const ch of syllable) {
      if (chars.includes(ch)) return Number(tone);
    }
  }
  const trailingDigit = syllable.match(/[1-4]$/);
  if (trailingDigit) return Number(trailingDigit[0]);
  return 5;
}

export interface PinyinSyllable {
  text: string;
  tone: number;
}

export function splitPinyinSyllables(pinyin: string): PinyinSyllable[] {
  return pinyin
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((syllable) => ({ text: syllable, tone: toneOfSyllable(syllable) }));
}
