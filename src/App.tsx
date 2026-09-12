import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import AddLessonPage from './pages/AddLessonPage';
import LessonDetailPage from './pages/LessonDetailPage';
import StudyPage from './pages/StudyPage';
import TestPage from './pages/TestPage';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lessons/new" element={<AddLessonPage />} />
          <Route path="/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
