import { useState, useEffect } from 'react';
import { Clock, Heart } from 'lucide-react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  love: '😍',
  excited: '🤩',
  peaceful: '😌',
  missing: '💭',
};

export default function MemoryLane() {
  const { user, partnerProfile } = useAuth();
  const [memories, setMemories] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'month' | 'happiest'>('all');

  useEffect(() => {
    loadMemories();
  }, [user, partnerProfile, filter]);

  async function loadMemories() {
    if (!user) return;

    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(id, name)')
        .order('created_at', { ascending: false });

      if (user && partnerProfile) {
        query = query.in('user_id', [user.id, partnerProfile.id]);
      }

      if (filter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        query = query.gte('created_at', oneMonthAgoStr + 'T00:00:00').lte('created_at', oneMonthAgoStr + 'T23:59:59');
      } else if (filter === 'happiest') {
        query = query.in('mood', ['happy', 'love', 'excited']).limit(20);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getTimeAgo(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return 'Today';
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="text-pink-500" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Memory Lane</h2>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
            }`}
          >
            All Memories
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              filter === 'month'
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
            }`}
          >
            One Month Ago
          </button>
          <button
            onClick={() => setFilter('happiest')}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              filter === 'happiest'
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
            }`}
          >
            Happiest Moments
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Heart className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-gray-500">No memories found for this filter</p>
        </div>
      ) : (
        <div className="space-y-6">
          {memories.map((memory) => (
            <div key={memory.id} className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {memory.profiles.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{memory.profiles.name}</p>
                    <p className="text-sm text-gray-500">{getTimeAgo(memory.created_at)}</p>
                    <p className="text-xs text-gray-400">{formatDate(memory.created_at)}</p>
                  </div>
                </div>
                <div className="text-3xl">{moodEmojis[memory.mood]}</div>
              </div>

              {memory.is_miss_you && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-pink-400 px-4 py-3 mb-4 rounded">
                  <p className="text-pink-800 font-medium">{memory.content}</p>
                </div>
              )}

              {!memory.is_miss_you && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{memory.content}</p>
              )}

              {memory.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img src={memory.image_url} alt="Memory" className="w-full object-cover max-h-96" />
                </div>
              )}

              {memory.song_link && (
                <a
                  href={memory.song_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  🎵 Song from this memory
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
