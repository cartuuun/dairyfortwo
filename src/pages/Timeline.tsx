import { useState, useEffect } from 'react';
import { Heart, Smile, HeartHandshake, Send, Image as ImageIcon, Music, Clock } from 'lucide-react';
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

const reactionIcons = {
  love: Heart,
  smile: Smile,
  hug: HeartHandshake,
};

export default function Timeline() {
  const { user, profile, partnerProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'theirs'>('all');
  const [newPost, setNewPost] = useState('');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [imageUrl, setImageUrl] = useState('');
  const [songLink, setSongLink] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadPosts();
    subscribeToNewPosts();
  }, [filter, user, partnerProfile]);

  async function loadPosts() {
    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(id, name)')
        .order('created_at', { ascending: false });

      if (filter === 'mine' && user) {
        query = query.eq('user_id', user.id);
      } else if (filter === 'theirs' && partnerProfile) {
        query = query.eq('user_id', partnerProfile.id);
      } else if (user && partnerProfile) {
        query = query.in('user_id', [user.id, partnerProfile.id]);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);

      if (data) {
        const postIds = data.map(p => p.id);
        const { data: reactionsData } = await supabase
          .from('reactions')
          .select('*')
          .in('post_id', postIds);

        const reactionsByPost: Record<string, any[]> = {};
        reactionsData?.forEach(reaction => {
          if (!reactionsByPost[reaction.post_id]) {
            reactionsByPost[reaction.post_id] = [];
          }
          reactionsByPost[reaction.post_id].push(reaction);
        });
        setReactions(reactionsByPost);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToNewPosts() {
    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    try {
      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: newPost,
          mood: selectedMood,
          image_url: imageUrl || null,
          song_link: songLink || null,
          is_miss_you: false,
        },
      ]);

      if (error) throw error;

      setNewPost('');
      setImageUrl('');
      setSongLink('');
      setShowPostForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  async function handleMissYou() {
    if (!user || !profile) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    try {
      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: `${profile.name} was missing you at ${timeStr} ❤️`,
          mood: 'missing',
          is_miss_you: true,
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending miss you:', error);
    }
  }

  async function handleReaction(postId: string, reactionType: 'love' | 'hug' | 'smile') {
    if (!user) return;

    try {
      const existingReaction = reactions[postId]?.find(r => r.user_id === user.id);

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          await supabase.from('reactions').delete().eq('id', existingReaction.id);
        } else {
          await supabase
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
        }
      } else {
        await supabase.from('reactions').insert([
          {
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          },
        ]);
      }

      loadPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleMissYou}
            className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-500 hover:to-pink-600 transition flex items-center justify-center gap-2"
          >
            <Heart size={20} fill="currentColor" />
            I Miss You
          </button>
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition"
          >
            New Post
          </button>
        </div>

        {showPostForm && (
          <form onSubmit={handleSubmitPost} className="space-y-4 animate-scale-in">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none"
              rows={3}
              required
            />

            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(moodEmojis).map(([mood, emoji]) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`px-3 py-2 rounded-lg border-2 transition ${
                    selectedMood === mood
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  {emoji} {mood}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={songLink}
                  onChange={(e) => setSongLink(e.target.value)}
                  placeholder="Song link (optional)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white py-2 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Post
            </button>
          </form>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'mine', 'theirs'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              filter === f
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            {f === 'all' ? 'All' : f === 'mine' ? 'Mine' : partnerProfile?.name || 'Theirs'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Heart className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading memories...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-gray-500">No posts yet. Start sharing your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.profiles.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{post.profiles.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{formatTimestamp(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl">{moodEmojis[post.mood]}</div>
              </div>

              {post.is_miss_you && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-pink-400 px-4 py-3 mb-4 rounded">
                  <p className="text-pink-800 font-medium">{post.content}</p>
                </div>
              )}

              {!post.is_miss_you && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>}

              {post.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img src={post.image_url} alt="Post" className="w-full object-cover max-h-96" />
                </div>
              )}

              {post.song_link && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl flex items-center gap-2">
                  <Music size={18} className="text-purple-600" />
                  <a
                    href={post.song_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline text-sm"
                  >
                    Listen to song
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                {Object.entries(reactionIcons).map(([type, Icon]) => {
                  const postReactions = reactions[post.id] || [];
                  const count = postReactions.filter((r) => r.reaction_type === type).length;
                  const userReacted = postReactions.some(
                    (r) => r.user_id === user?.id && r.reaction_type === type
                  );

                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(post.id, type as any)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
                        userReacted
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-50 text-gray-600 hover:bg-pink-50'
                      }`}
                    >
                      <Icon size={18} fill={userReacted ? 'currentColor' : 'none'} />
                      {count > 0 && <span className="text-sm font-medium">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
