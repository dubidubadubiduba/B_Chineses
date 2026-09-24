import { signInWithGoogle } from '../auth/AuthContext';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">초미녀 Bomi의 중국어 단어장</h1>
        <p className="mt-1 text-sm text-gray-400">超级美女Bomi的中文单词本</p>
        <p className="mt-2 text-sm text-gray-500">
          로그인하면 여러 기기에서 같은 단어장을 볼 수 있어요.
        </p>
      </div>
      <button
        type="button"
        onClick={() => signInWithGoogle().catch((err) => console.error('로그인 실패:', err))}
        className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white shadow"
      >
        Google로 로그인
      </button>
    </div>
  );
}
