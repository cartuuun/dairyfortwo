import { useState, useEffect } from 'react';
import { Music, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { supabase, PlaylistItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Playlist() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlaylist();
    subscribeToChanges();
  }, []);

  async function loadPlaylist() {
    try {
      const { data, error } = await supabase
        .from('playlist')
        .select('*, profiles(id, name)')
        .order('added_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToChanges() {
    const channel = supabase
      .channel('playlist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist' }, () => {
        loadPlaylist();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleAddSong(e: React.FormEvent) {
    e.preventDefault();
    if (!songTitle.trim() || !songUrl.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('playlist').insert([
        {
          user_id: user.id,
          song_title: songTitle,
          song_url: songUrl,
        },
      ]);

      if (error) throw error;

      setSongTitle('');
      setSongUrl('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSong(songId: string, songUserId: string) {
    if (user?.id !== songUserId) return;

    try {
      const { error } = await supabase.from('playlist').delete().eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  }

  function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Music className="text-pink-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Shared Playlist</h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition"
          >
            <Plus size={20} />
            Add Song
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSong} className="space-y-4 mb-6 animate-scale-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Song Title</label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Enter song title"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Song URL (Spotify, YouTube, etc.)
              </label>
              <input
                type="url"
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white py-3 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add to Playlist'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Music className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading playlist...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-gray-500">No songs yet. Add your first song!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4 animate-fade-in hover:shadow-xl transition"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{song.song_title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>Added by {song.profiles.name}</span>
                  <span>•</span>
                  <span>{formatDate(song.added_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={song.song_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                  title="Listen"
                >
                  <ExternalLink size={20} />
                </a>

                {user?.id === song.user_id && (
                  <button
                    onClick={() => handleDeleteSong(song.id, song.user_id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
