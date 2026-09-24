export interface Lesson {
  id?: string;
  date: string; // YYYY-MM-DD
  title?: string;
  rawText?: string;
  createdAt: number;
}

export interface Word {
  id?: string;
  lessonId: string;
  simplified: string;
  pinyin: string;
  meaningKr: string;
  exampleCn?: string;
  examplePinyin?: string;
  exampleKr?: string;
  tags?: string[];
  srsBox: number; // 0-4, Leitner box
  nextReviewDate: string; // YYYY-MM-DD
  createdAt: number;
}

export type SwipeResult = 'know' | 'unknown';

export interface ReviewLog {
  id?: string;
  wordId: string;
  date: string; // YYYY-MM-DD
  result: SwipeResult;
}
