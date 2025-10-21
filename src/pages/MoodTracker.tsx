import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  love: '😍',
  excited: '🤩',
  peaceful: '😌',
  missing: '💭',
  tired: '😴',
};

type MoodStats = {
  mood: string;
  count: number;
  percentage: number;
};

export default function MoodTracker() {
  const { user, profile, partnerProfile } = useAuth();
  const [myMoods, setMyMoods] = useState<MoodStats[]>([]);
  const [partnerMoods, setPartnerMoods] = useState<MoodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadMoodData();
  }, [user, partnerProfile, timeRange]);

  async function loadMoodData() {
    if (!user) return;

    try {
      const daysAgo = timeRange === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const myPostsQuery = supabase
        .from('posts')
        .select('mood')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const myDiaryQuery = supabase
        .from('daily_diary')
        .select('mood')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const [myPostsRes, myDiaryRes] = await Promise.all([myPostsQuery, myDiaryQuery]);

      const myAllMoods = [
        ...(myPostsRes.data || []).map((p) => p.mood),
        ...(myDiaryRes.data || []).map((d) => d.mood),
      ];

      setMyMoods(calculateMoodStats(myAllMoods));

      if (partnerProfile) {
        const partnerPostsQuery = supabase
          .from('posts')
          .select('mood')
          .eq('user_id', partnerProfile.id)
          .gte('created_at', startDate.toISOString());

        const partnerDiaryQuery = supabase
          .from('daily_diary')
          .select('mood')
          .eq('user_id', partnerProfile.id)
          .gte('created_at', startDate.toISOString());

        const [partnerPostsRes, partnerDiaryRes] = await Promise.all([
          partnerPostsQuery,
          partnerDiaryQuery,
        ]);

        const partnerAllMoods = [
          ...(partnerPostsRes.data || []).map((p) => p.mood),
          ...(partnerDiaryRes.data || []).map((d) => d.mood),
        ];

        setPartnerMoods(calculateMoodStats(partnerAllMoods));
      }
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateMoodStats(moods: string[]): MoodStats[] {
    const moodCounts: Record<string, number> = {};
    moods.forEach((mood) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const total = moods.length;
    const stats = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }

  function renderMoodChart(moods: MoodStats[], title: string) {
    const maxCount = Math.max(...moods.map((m) => m.count), 1);

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>

        {moods.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No mood data available for this period</p>
        ) : (
          <div className="space-y-3">
            {moods.map((stat) => (
              <div key={stat.mood}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{moodEmojis[stat.mood]}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{stat.mood}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {stat.count} ({stat.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-rose-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(stat.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-pink-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Mood Tracker</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                timeRange === 'week'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                timeRange === 'month'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
              }`}
            >
              Last Month
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading mood data...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {renderMoodChart(myMoods, profile?.name || 'Your Moods')}
            {partnerProfile && renderMoodChart(partnerMoods, partnerProfile.name + "'s Moods")}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 border border-pink-100">
        <h3 className="text-lg font-bold text-gray-800 mb-3">About Mood Tracking</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Mood tracking helps you understand emotional patterns over time. This data is collected from your
          posts and diary entries. The more you share, the more insightful your mood trends become.
        </p>
      </div>
    </div>
  );
}
