import { useEffect, useState, type DependencyList } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  type DocumentReference,
  type Query,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { Lesson, Word, ReviewLog } from './types';

export function lessonsCol(uid: string) {
  return collection(firestore, 'users', uid, 'lessons');
}

export function wordsCol(uid: string) {
  return collection(firestore, 'users', uid, 'words');
}

export function reviewLogsCol(uid: string) {
  return collection(firestore, 'users', uid, 'reviewLogs');
}

function stripUndefined<T extends DocumentData>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) delete result[key];
  }
  return result;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export function useCollectionQuery<T>(
  factory: () => Query<DocumentData> | null,
  deps: DependencyList,
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    const q = factory();
    if (!q) {
      setData(undefined);
      return;
    }
    setData(undefined);
    const unsubscribe = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

export function useDocQuery<T>(
  factory: () => DocumentReference<DocumentData> | null,
  deps: DependencyList,
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    const ref = factory();
    if (!ref) {
      setData(undefined);
      return;
    }
    setData(undefined);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

export function useLessons(uid: string) {
  return useCollectionQuery<Lesson>(() => query(lessonsCol(uid), orderBy('date', 'desc')), [uid]);
}

export function useLesson(uid: string, lessonId: string) {
  return useDocQuery<Lesson>(() => doc(lessonsCol(uid), lessonId), [uid, lessonId]);
}

export function useWords(uid: string, lessonId?: string) {
  return useCollectionQuery<Word>(
    () => (lessonId ? query(wordsCol(uid), where('lessonId', '==', lessonId)) : wordsCol(uid)),
    [uid, lessonId],
  );
}

export async function addLesson(uid: string, data: Omit<Lesson, 'id'>): Promise<string> {
  const ref = await addDoc(lessonsCol(uid), stripUndefined(data));
  return ref.id;
}

export async function bulkAddWords(uid: string, words: Omit<Word, 'id'>[]): Promise<void> {
  for (const group of chunk(words, 400)) {
    const batch = writeBatch(firestore);
    for (const w of group) {
      batch.set(doc(wordsCol(uid)), stripUndefined(w));
    }
    await batch.commit();
  }
}

export async function updateWord(uid: string, wordId: string, patch: Partial<Word>): Promise<void> {
  await updateDoc(doc(wordsCol(uid), wordId), stripUndefined(patch));
}

export async function deleteWord(uid: string, wordId: string): Promise<void> {
  await deleteDoc(doc(wordsCol(uid), wordId));
}

export async function deleteLesson(uid: string, lessonId: string): Promise<void> {
  const wordDocs = await getDocs(query(wordsCol(uid), where('lessonId', '==', lessonId)));
  for (const group of chunk(wordDocs.docs, 400)) {
    const batch = writeBatch(firestore);
    for (const d of group) batch.delete(d.ref);
    await batch.commit();
  }
  await deleteDoc(doc(lessonsCol(uid), lessonId));
}

export async function addReviewLog(uid: string, log: Omit<ReviewLog, 'id'>): Promise<void> {
  await addDoc(reviewLogsCol(uid), log);
}
