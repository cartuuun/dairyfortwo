/*
  # Create Initial Database Schema for Romantic Couples App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `partner_id` (uuid, nullable, references profiles)
      - `created_at` (timestamptz)
    
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `mood` (text)
      - `image_url` (text, nullable)
      - `song_link` (text, nullable)
      - `is_miss_you` (boolean)
      - `created_at` (timestamptz)
    
    - `reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references posts)
      - `user_id` (uuid, references profiles)
      - `reaction_type` (text: love, hug, smile)
      - `created_at` (timestamptz)
    
    - `photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `photo_url` (text)
      - `caption` (text, nullable)
      - `uploaded_at` (timestamptz)
    
    - `playlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `song_title` (text)
      - `song_url` (text)
      - `added_at` (timestamptz)
    
    - `daily_diaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `content` (text)
      - `mood` (text)
      - `created_at` (timestamptz)
    
    - `quotes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `quote_text` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `message` (text)
      - `is_read` (boolean)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and write their own data and their partner's data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  partner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile and partner profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = partner_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  mood text NOT NULL DEFAULT 'happy',
  image_url text,
  song_link text,
  is_miss_you boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts and partner posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'hug', 'smile')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on accessible posts"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts 
      WHERE user_id = auth.uid() OR 
      user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reactions"
  ON reactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos and partner photos"
  ON photos FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create playlist table
CREATE TABLE IF NOT EXISTS playlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_title text NOT NULL,
  song_url text NOT NULL,
  added_at timestamptz DEFAULT now()
);

ALTER TABLE playlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own songs and partner songs"
  ON playlist FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own songs"
  ON playlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own songs"
  ON playlist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create daily_diaries table
CREATE TABLE IF NOT EXISTS daily_diaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  content text NOT NULL,
  mood text NOT NULL DEFAULT 'happy',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diaries and partner diaries"
  ON daily_diaries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own diaries"
  ON daily_diaries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diaries"
  ON daily_diaries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes sent to them"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create quotes for partner"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update quotes sent to them"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    sender_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages sent to them"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    sender_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    sender_id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_user_id ON playlist(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at DESC);