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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error:
          'GEMINI_API_KEY가 설정되지 않았습니다. 로컬은 .env.local, 배포 환경은 호스팅 서비스의 환경변수 설정에 키를 추가해주세요.',
      }),
    );
    return;
  }

  const word = simplified.trim();

  const prompt = `"${word}"는 중국어 단어를 나타내려고 입력한 값이야. 이미 올바른 중국어 간체일 수도 있고, 한국어 발음 표기(예: 파피아오 → 发票)나 한국어 뜻(예: 합동 → 合同)으로 잘못 입력됐을 수도 있어. 두 경우 모두 실제 의도한 중국어 단어를 알아내서 아래 JSON 형식으로만 응답해. 설명이나 마크다운 코드블록 없이 순수 JSON 객체만 출력해.
{
  "simplified": "올바른 중국어 간체 단어 (한글이 절대 들어가면 안 됨)",
  "pinyin": "성조 부호가 있는 병음 (예: nǐ hǎo, 한글 절대 금지)",
  "meaningKr": "한국어 뜻 (간결하게, 품사 포함 가능)",
  "exampleCn": "이 단어를 사용한 HSK5 수준의 중국어 예문 한 문장",
  "examplePinyin": "위 예문의 병음",
  "exampleKr": "위 예문의 한국어 번역"
}`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  const maxAttempts = 3;
  let response;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody },
      );
      if (response.ok || response.status !== 503 || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }

    if (!response.ok) {
      const errText = await response.text();
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Gemini API 오류: ${errText}` }));
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '단어 정보를 생성하지 못했습니다.' }));
      return;
    }

    const info = JSON.parse(jsonMatch[0]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
