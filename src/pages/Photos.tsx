import { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { supabase, Photo } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Photos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhotos();
    const cleanup = subscribeToChanges();
    return cleanup;
  }, []);

  async function loadPhotos() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*, profiles(id, name)')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToChanges() {
    const channel = supabase
      .channel('photos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        loadPhotos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!photoUrl.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('photos').insert([
        {
          user_id: user.id,
          photo_url: photoUrl,
          caption: caption || null,
        },
      ]);

      if (error) throw error;

      setPhotoUrl('');
      setCaption('');
      setShowAddForm(false);
      await loadPhotos();
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto(photoId: string, photoUserId: string) {
    if (user?.id !== photoUserId) return;

    try {
      const { error } = await supabase.from('photos').delete().eq('id', photoId);

      if (error) throw error;
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-effect rounded-2xl shadow-xl p-6 mb-6 card-hover-lift">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-pink-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Photo Moments</h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-br from-pink-400 to-rose-400 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all shadow-md"
          >
            <Plus size={20} />
            Add Photo
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddPhoto} className="space-y-4 mb-6 animate-scale-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption for this moment..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-br from-pink-400 to-rose-400 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 shadow-md"
              >
                {saving ? 'Adding...' : 'Add Photo'}
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
          <ImageIcon className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-gray-500">No photos yet. Add your first memory!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="glass-effect rounded-2xl shadow-lg overflow-hidden animate-fade-in card-hover-lift cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>

              <div className="p-4">
                {photo.caption && <p className="text-gray-700 mb-2">{photo.caption}</p>}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {photo.profiles.name}</span>
                  <span>{formatDate(photo.uploaded_at)}</span>
                </div>

                {user?.id === photo.user_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id, photo.user_id);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition"
          >
            <X size={24} className="text-gray-800" />
          </button>

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'Photo'}
              className="w-full h-auto rounded-2xl"
            />

            {selectedPhoto.caption && (
              <div className="bg-white rounded-xl p-4 mt-4">
                <p className="text-gray-700">{selectedPhoto.caption}</p>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>By {selectedPhoto.profiles.name}</span>
                  <span>{formatDate(selectedPhoto.uploaded_at)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
