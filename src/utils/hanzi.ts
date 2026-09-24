export function containsHangul(text: string): boolean {
  return /[가-힣]/.test(text);
}

export function containsHanzi(text: string): boolean {
  return /[一-鿿]/.test(text);
}

export function isLikelyValidSimplified(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return containsHanzi(trimmed) && !containsHangul(trimmed);
}
