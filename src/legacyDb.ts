import Dexie, { type Table } from 'dexie';

// Superseded by Firestore (src/store.ts). Kept only so migrateLocalData.ts can
// read whatever was saved locally before cloud sync existed, on the device
// that has it, and offer a one-time import into the user's cloud account.

export interface LegacyLesson {
  id?: number;
  date: string;
  title?: string;
  rawText?: string;
  createdAt: number;
}

export interface LegacyWord {
  id?: number;
  lessonId: number;
  simplified: string;
  pinyin: string;
  meaningKr: string;
  exampleCn?: string;
  examplePinyin?: string;
  exampleKr?: string;
  tags?: string[];
  srsBox: number;
  nextReviewDate: string;
  createdAt: number;
}

export interface LegacyReviewLog {
  id?: number;
  wordId: number;
  date: string;
  result: 'know' | 'unknown';
}

export class LegacyVocabDB extends Dexie {
  lessons!: Table<LegacyLesson, number>;
  words!: Table<LegacyWord, number>;
  reviewLogs!: Table<LegacyReviewLog, number>;

  constructor() {
    super('chinese-vocab-db');
    this.version(1).stores({
      lessons: '++id, date, createdAt',
      words: '++id, lessonId, simplified, nextReviewDate, srsBox, createdAt, *tags',
      reviewLogs: '++id, wordId, date',
    });
  }
}

export const legacyDb = new LegacyVocabDB();
