import Dexie, { type Table } from 'dexie';
import type { Lesson, Word, ReviewLog } from './types';

export class VocabDB extends Dexie {
  lessons!: Table<Lesson, number>;
  words!: Table<Word, number>;
  reviewLogs!: Table<ReviewLog, number>;

  constructor() {
    super('chinese-vocab-db');
    this.version(1).stores({
      lessons: '++id, date, createdAt',
      words: '++id, lessonId, simplified, nextReviewDate, srsBox, createdAt, *tags',
      reviewLogs: '++id, wordId, date',
    });
  }
}

export const db = new VocabDB();
