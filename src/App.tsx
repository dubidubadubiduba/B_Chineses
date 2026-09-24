import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import AddLessonPage from './pages/AddLessonPage';
import LessonDetailPage from './pages/LessonDetailPage';
import StudyPage from './pages/StudyPage';
import TestPage from './pages/TestPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth, signOutUser } from './auth/AuthContext';
import {
  getLegacyCounts,
  isMigrationDone,
  markMigrationDone,
  migrateLegacyData,
} from './migrateLocalData';

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);
  return online;
}

function AppRoutes() {
  const online = useOnlineStatus();
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto flex max-w-[480px] items-center justify-between p-2">
        {online ? (
          <span />
        ) : (
          <span className="text-xs text-amber-600">
            오프라인 · 변경사항은 나중에 자동으로 동기화됩니다
          </span>
        )}
        <button type="button" onClick={() => signOutUser()} className="text-xs text-gray-400">
          로그아웃
        </button>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lessons/new" element={<AddLessonPage />} />
        <Route path="/lessons/:id" element={<LessonDetailPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

type LegacyCounts = { lessons: number; words: number; reviewLogs: number };
type MigrationState = 'checking' | 'prompt' | 'running' | 'done';

function MigrationGate({ uid, children }: { uid: string; children: ReactNode }) {
  const [state, setState] = useState<MigrationState>('checking');
  const [counts, setCounts] = useState<LegacyCounts | null>(null);

  useEffect(() => {
    if (isMigrationDone()) {
      setState('done');
      return;
    }
    getLegacyCounts().then((c) => {
      if (c.lessons === 0 && c.words === 0) {
        markMigrationDone();
        setState('done');
      } else {
        setCounts(c);
        setState('prompt');
      }
    });
  }, []);

  const [importError, setImportError] = useState('');

  async function handleImport() {
    setState('running');
    setImportError('');
    try {
      await migrateLegacyData(uid);
      setState('done');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
      setState('prompt');
    }
  }

  function handleSkip() {
    markMigrationDone();
    setState('done');
  }

  if (state === 'checking') return null;

  if (state === 'prompt' && counts) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-medium">이 기기에서 단어 {counts.words}개를 발견했어요.</p>
        <p className="text-sm text-gray-500">
          클라우드로 가져와서 다른 기기에서도 볼 수 있게 할까요?
        </p>
        {importError && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">가져오기 실패: {importError}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm text-gray-600"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            가져오기
          </button>
        </div>
      </div>
    );
  }

  if (state === 'running') {
    return <p className="p-8 text-center text-gray-400">단어를 가져오는 중...</p>;
  }

  return <>{children}</>;
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginPage />;
  return (
    <MigrationGate uid={user.uid}>
      <AppRoutes />
    </MigrationGate>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
