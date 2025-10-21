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
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={64} />
          <p className="text-xl font-medium text-gray-600">Loading DiaryForTwo...</p>
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
