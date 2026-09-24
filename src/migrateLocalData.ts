import { doc, writeBatch, type DocumentData, type DocumentReference } from 'firebase/firestore';
import { firestore } from './firebase';
import { legacyDb } from './legacyDb';
import { chunk, lessonsCol, reviewLogsCol, wordsCol } from './store';

const MIGRATION_FLAG = 'migrated_v1';

export function isMigrationDone(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === '1';
}

export function markMigrationDone(): void {
  localStorage.setItem(MIGRATION_FLAG, '1');
}

export async function getLegacyCounts() {
  const [lessons, words, reviewLogs] = await Promise.all([
    legacyDb.lessons.count(),
    legacyDb.words.count(),
    legacyDb.reviewLogs.count(),
  ]);
  return { lessons, words, reviewLogs };
}

async function commitInChunks(items: { ref: DocumentReference; data: DocumentData }[]) {
  for (const group of chunk(items, 400)) {
    const batch = writeBatch(firestore);
    for (const { ref, data } of group) batch.set(ref, data);
    await batch.commit();
  }
}

export async function migrateLegacyData(uid: string): Promise<void> {
  const [lessons, words, reviewLogs] = await Promise.all([
    legacyDb.lessons.toArray(),
    legacyDb.words.toArray(),
    legacyDb.reviewLogs.toArray(),
  ]);

  const lessonIdMap = new Map<number, string>();
  const lessonWrites = lessons.map((lesson) => {
    const { id: oldId, ...data } = lesson;
    const ref = doc(lessonsCol(uid));
    lessonIdMap.set(oldId!, ref.id);
    return { ref, data };
  });
  await commitInChunks(lessonWrites);

  const wordIdMap = new Map<number, string>();
  const wordWrites = words.flatMap((word) => {
    const newLessonId = lessonIdMap.get(word.lessonId);
    if (!newLessonId) return [];
    const { id: oldId, lessonId: _oldLessonId, ...rest } = word;
    const ref = doc(wordsCol(uid));
    wordIdMap.set(oldId!, ref.id);
    return [{ ref, data: { ...rest, lessonId: newLessonId } }];
  });
  await commitInChunks(wordWrites);

  const reviewLogWrites = reviewLogs.flatMap((log) => {
    const newWordId = wordIdMap.get(log.wordId);
    if (!newWordId) return [];
    const { id: _oldId, wordId: _oldWordId, ...rest } = log;
    const ref = doc(reviewLogsCol(uid));
    return [{ ref, data: { ...rest, wordId: newWordId } }];
  });
  await commitInChunks(reviewLogWrites);

  markMigrationDone();
}
