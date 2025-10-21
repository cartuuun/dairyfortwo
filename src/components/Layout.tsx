import { ReactNode, useState } from 'react';
import { Heart, Home, BookOpen, TrendingUp, Clock, Music, Quote, MessageCircle, Image, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LayoutProps = {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { signOut, profile } = useAuth();
  const [showQuotes, setShowQuotes] = useState(false);

  const navItems = [
    { id: 'timeline', icon: Home, label: 'Timeline' },
    { id: 'diary', icon: BookOpen, label: 'Diary' },
    { id: 'mood', icon: TrendingUp, label: 'Mood' },
    { id: 'memory', icon: Clock, label: 'Memory' },
    { id: 'playlist', icon: Music, label: 'Playlist' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'photos', icon: Image, label: 'Photos' },
  ];

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <header className="bg-white border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="text-white" size={20} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              DiaryForTwo
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowQuotes(!showQuotes)}
              className="p-2 rounded-full hover:bg-pink-50 transition"
              title="Love Quotes"
            >
              <Quote size={20} className="text-pink-500" />
            </button>
            <div className="text-sm text-gray-600">
              Hi, <span className="font-semibold text-pink-600">{profile?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-pink-50 transition"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-pink-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {showQuotes && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuotes(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-pink-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Love Quotes</h2>
            </div>
            <div className="text-center text-gray-600">
              <p className="italic">Quotes feature coming soon in the Quotes page!</p>
            </div>
            <button
              onClick={() => setShowQuotes(false)}
              className="w-full mt-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white py-2 rounded-xl font-medium hover:from-rose-500 hover:to-pink-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
