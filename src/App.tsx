import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import Diary from './pages/Diary';
import MoodTracker from './pages/MoodTracker';
import MemoryLane from './pages/MemoryLane';
import Playlist from './pages/Playlist';
import Chat from './pages/Chat';
import Photos from './pages/Photos';
import { Heart } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('timeline');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="animate-float text-rose-400 mx-auto mb-6" size={72} fill="currentColor" />
          <p className="text-2xl font-medium gradient-text-romantic">Loading DiaryForTwo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'timeline':
        return <Timeline />;
      case 'diary':
        return <Diary />;
      case 'mood':
        return <MoodTracker />;
      case 'memory':
        return <MemoryLane />;
      case 'playlist':
        return <Playlist />;
      case 'chat':
        return <Chat />;
      case 'photos':
        return <Photos />;
      default:
        return <Timeline />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
