import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  partner_id: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  image_url: string | null;
  song_link: string | null;
  is_miss_you: boolean;
  created_at: string;
  profiles: Profile;
};

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'love' | 'hug' | 'smile';
  created_at: string;
};

export type DailyDiary = {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood: string;
  created_at: string;
  profiles: Profile;
};

export type PlaylistItem = {
  id: string;
  user_id: string;
  song_title: string;
  song_url: string;
  added_at: string;
  profiles: Profile;
};

export type Quote = {
  id: string;
  user_id: string;
  quote_text: string;
  is_read: boolean;
  created_at: string;
  profiles: Profile;
};

export type Photo = {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  uploaded_at: string;
  profiles: Profile;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  profiles: Profile;
};
