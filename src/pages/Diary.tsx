import { useState, useEffect } from 'react';
import { Calendar, Save } from 'lucide-react';
import { supabase, DailyDiary } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  love: '😍',
  excited: '🤩',
  peaceful: '😌',
  tired: '😴',
};

export default function Diary() {
  const { user, profile, partnerProfile } = useAuth();
  const [entries, setEntries] = useState<DailyDiary[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyDiary | null>(null);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDiaryEntries();
  }, [user, partnerProfile]);

  async function loadDiaryEntries() {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('daily_diary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setTodayEntry(todayData);
      if (todayData) {
        setContent(todayData.content);
        setSelectedMood(todayData.mood);
      }

      let query = supabase
        .from('daily_diary')
        .select('*, profiles(id, name)')
        .order('date', { ascending: false })
        .limit(10);

      if (user && partnerProfile) {
        query = query.in('user_id', [user.id, partnerProfile.id]);
      } else if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading diary:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim() || !user) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (todayEntry) {
        const { error } = await supabase
          .from('daily_diary')
          .update({ content, mood: selectedMood })
          .eq('id', todayEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_diary').insert([
          {
            user_id: user.id,
            date: today,
            content,
            mood: selectedMood,
          },
        ]);

        if (error) throw error;
      }

      await loadDiaryEntries();
    } catch (error) {
      console.error('Error saving diary:', error);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-pink-500" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Daily Diary</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling today?</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(moodEmojis).map(([mood, emoji]) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedMood === mood
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-2xl mr-2">{emoji}</span>
                  <span className="text-sm font-medium">{mood}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What happened today?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day... Share your thoughts, feelings, and moments worth remembering."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none"
              rows={8}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white py-3 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Recent Entries</h3>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500">No diary entries yet. Start writing!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {entry.profiles.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{entry.profiles.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <div className="text-3xl">{moodEmojis[entry.mood]}</div>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
