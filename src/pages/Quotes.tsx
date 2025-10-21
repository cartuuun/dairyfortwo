import { useState, useEffect } from 'react';
import { Quote as QuoteIcon, Plus, Sparkles } from 'lucide-react';
import { supabase, Quote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Quotes() {
  const { user, partnerProfile } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuotes();
    subscribeToChanges();
  }, [user, partnerProfile]);

  async function loadQuotes() {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, profiles(id, name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);

      if (user && data) {
        const unreadIds = data
          .filter((quote) => quote.user_id !== user.id && !quote.is_read)
          .map((quote) => quote.id);

        if (unreadIds.length > 0) {
          await supabase.from('quotes').update({ is_read: true }).in('id', unreadIds);
        }
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToChanges() {
    const channel = supabase
      .channel('quotes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        loadQuotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleAddQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!quoteText.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('quotes').insert([
        {
          user_id: user.id,
          quote_text: quoteText,
        },
      ]);

      if (error) throw error;

      setQuoteText('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding quote:', error);
    } finally {
      setSaving(false);
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
            <Sparkles className="text-pink-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Love Quotes</h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition"
          >
            <Plus size={20} />
            Add Quote
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddQuote} className="space-y-4 mb-6 animate-scale-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Love Quote or Note
              </label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Share a sweet quote, a loving message, or a meaningful thought..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white py-3 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Quote'}
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

        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-pink-100">
          <p className="text-sm text-gray-600">
            Drop sweet notes and quotes for each other. These are little love letters that brighten your day.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Sparkles className="animate-bounce-slow text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-gray-500">No quotes yet. Share your first loving message!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-pink-100 animate-fade-in"
            >
              <div className="flex items-start gap-3 mb-4">
                <QuoteIcon className="text-pink-400 flex-shrink-0 mt-1" size={24} />
                <p className="text-gray-700 italic leading-relaxed flex-1">"{quote.quote_text}"</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {quote.profiles.name[0].toUpperCase()}
                  </div>
                  <span className="text-gray-600 font-medium">{quote.profiles.name}</span>
                </div>
                <span className="text-gray-500">{formatDate(quote.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
