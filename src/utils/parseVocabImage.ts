export interface ParsedWord {
  simplified?: string;
  pinyin?: string;
  meaningKr?: string;
  exampleCn?: string;
  examplePinyin?: string;
  exampleKr?: string;
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(',');
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function parseVocabImage(file: File): Promise<ParsedWord[]> {
  const { base64, mimeType } = await fileToBase64(file);
  const res = await fetch('/api/parse-vocab-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }
  return (data.words ?? []) as ParsedWord[];
}
