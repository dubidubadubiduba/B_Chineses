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

  let imageBase64, mimeType;
  try {
    const parsed = JSON.parse(body);
    imageBase64 = parsed.imageBase64;
    mimeType = parsed.mimeType;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '요청 형식이 올바르지 않습니다.' }));
    return;
  }

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '이미지가 필요합니다.' }));
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

  const prompt = `이 이미지는 중국어 단어장 사진이야 (수업 노트, 교재, 다른 앱 캡처 화면 등). 이미지 안의 단어들을 전부 읽어서 아래 JSON 배열 형식으로만 응답해. 설명이나 마크다운 코드블록 없이 순수 JSON 배열만 출력해.

각 단어 항목:
{
  "simplified": "중국어 간체 (필수, 한글 절대 금지)",
  "pinyin": "성조 부호가 있는 병음 (이미지에 없으면 네가 채워넣기)",
  "meaningKr": "한국어 뜻 (이미지에 있으면 그대로, 없으면 네가 채워넣기)",
  "exampleCn": "이 단어를 사용한 HSK5 수준 중국어 예문 한 문장 (이미지에 예문이 있으면 그걸 쓰고, 없으면 새로 만들기)",
  "examplePinyin": "위 예문의 병음",
  "exampleKr": "위 예문의 한국어 번역"
}

이미지에서 읽을 수 있는 단어를 빠짐없이 전부 포함해줘.`;

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
        ],
      },
    ],
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
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '이미지에서 단어를 읽지 못했습니다.' }));
      return;
    }

    const words = JSON.parse(jsonMatch[0]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ words }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
