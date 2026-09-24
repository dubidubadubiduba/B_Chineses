export interface WordInfoResult {
  simplified?: string;
  pinyin?: string;
  meaningKr?: string;
  exampleCn?: string;
  examplePinyin?: string;
  exampleKr?: string;
}

export async function fetchWordInfo(simplified: string): Promise<WordInfoResult> {
  const res = await fetch('/api/generate-word-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simplified }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }
  return data as WordInfoResult;
}
