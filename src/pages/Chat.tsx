import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { supabase, ChatMessage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Chat() {
  const { user, profile, partnerProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [user, partnerProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles(id, name)')
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      if (user && data) {
        const unreadIds = data
          .filter((msg) => msg.sender_id !== user.id && !msg.is_read)
          .map((msg) => msg.id);

        if (unreadIds.length > 0) {
          await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel('chat_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from('chat_messages').insert([
        {
          sender_id: user.id,
          message: newMessage,
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-220px)] flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-lg p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-pink-500" size={28} />
          <div>
            <h2 className="text-xl font-bold text-gray-800">Private Chat</h2>
            <p className="text-sm text-gray-500">
              {partnerProfile ? `Chatting with ${partnerProfile.name}` : 'Your private conversation'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender_id === user?.id;
            return (
              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-xs md:max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
                  {!isMe && (
                    <p className="text-xs text-gray-500 mb-1 ml-2">{message.profiles.name}</p>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isMe
                        ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                    {formatTime(message.sent_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-b-2xl shadow-lg p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-pink-400 to-rose-400 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
