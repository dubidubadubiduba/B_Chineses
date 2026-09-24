# 초미녀 Bomi의 중국어 단어장 (超级美女Bomi的中文单词本)

화상 중국어 수업에서 배운 단어를 기록하고 SRS(간격 반복)로 복습하는 PWA. Firebase로 여러 기기 간 동기화되고, 오프라인에서도 동작한다.

## 기능

- 수업 단위로 단어(간체/병음/한국어 뜻/예문) 등록, 검색, 학습, 시험
- Google 로그인 + Firestore 동기화 (기기 간 공유)
- Firestore 오프라인 캐시 — 네트워크 없이도 이미 동기화된 데이터 읽기/쓰기, 재연결 시 자동 동기화
- 단어장 사진 업로드 → Gemini Vision이 읽어서 단어 입력칸 자동 채우기
- PWA 설치 지원 (홈 화면 추가, 오프라인 앱 셸)

## 기술 스택

React + TypeScript + Vite, Tailwind CSS, React Router, Firebase (Auth/Firestore), Google Gemini API, vite-plugin-pwa. 배포는 Vercel.

## 로컬 개발

```bash
npm install
npm run dev
```

`.env.local` 필요 (`.env.local.example` 참고):

- `APPCFG_FIREBASE_*` 6개 — Firebase 콘솔 프로젝트 설정에서 발급 (Authentication에서 Google 로그인 활성화 + Firestore 생성 + 보안 규칙 설정 필요)
- `GEMINI_API_KEY` — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 무료 발급

배포 환경(Vercel)에도 동일한 환경변수를 등록해야 함. `VITE_` 접두사는 Vercel이 "공개 프레임워크 변수"로 인식해 저장을 막을 수 있어서, Firebase 값은 `APPCFG_` 접두사를 쓰고 `vite.config.ts`의 `envPrefix`에 등록해 클라이언트에 노출시킨다.

## Firestore 보안 규칙

각 사용자가 자신의 데이터만 읽고 쓸 수 있게 제한:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 타입 체크 + 프로덕션 빌드
- `npm run lint` — oxlint
