// Runs both as a Vercel serverless function (production) and, via the
// dev middleware in vite.config.ts, as a local dev endpoint. Keep this
// file plain Node http (req/res), no framework-specific helpers, so it
// works identically in both environments.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let simplified;
  try {
    simplified = JSON.parse(body).simplified;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '요청 형식이 올바르지 않습니다.' }));
    return;
  }

  if (!simplified || typeof simplified !== 'string' || !simplified.trim()) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '간체 단어가 필요합니다.' }));
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error:
          'ANTHROPIC_API_KEY가 설정되지 않았습니다. 로컬은 .env.local, 배포 환경은 호스팅 서비스의 환경변수 설정에 키를 추가해주세요.',
      }),
    );
    return;
  }

  const word = simplified.trim();

  try {
    const prompt = `"${word}"는 중국어 단어를 나타내려고 입력한 값이야. 이미 올바른 중국어 간체일 수도 있고, 한국어 발음 표기(예: 파피아오 → 发票)나 한국어 뜻(예: 합동 → 合同)으로 잘못 입력됐을 수도 있어. 두 경우 모두 실제 의도한 중국어 단어를 알아내서 아래 JSON 형식으로만 응답해. 설명이나 마크다운 코드블록 없이 순수 JSON 객체만 출력해.
{
  "simplified": "올바른 중국어 간체 단어 (한글이 절대 들어가면 안 됨)",
  "pinyin": "성조 부호가 있는 병음 (예: nǐ hǎo, 한글 절대 금지)",
  "meaningKr": "한국어 뜻 (간결하게, 품사 포함 가능)",
  "exampleCn": "이 단어를 사용한 HSK5 수준의 중국어 예문 한 문장",
  "examplePinyin": "위 예문의 병음",
  "exampleKr": "위 예문의 한국어 번역"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Anthropic API 오류: ${errText}` }));
      return;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 응답을 해석할 수 없습니다.' }));
      return;
    }

    const result = JSON.parse(jsonMatch[0]);

    const hasHangul = (s) => typeof s === 'string' && /[가-힣]/.test(s);
    const hasHanzi = (s) => typeof s === 'string' && /[一-鿿]/.test(s);
    if (hasHangul(result.simplified) || !hasHanzi(result.simplified) || hasHangul(result.pinyin)) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: `AI가 "${word}"에 대해 올바른 중국어 결과를 만들지 못했습니다. 단어를 다시 확인하고 재시도해주세요.`,
        }),
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err instanceof Error ? err.message : err) }));
  }
}
