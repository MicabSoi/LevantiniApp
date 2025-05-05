/*
  # Levantini Language Learning Schema

  1. New Tables
    - `vocabulary_items`
      - `id` (uuid, primary key)
      - `arabic` (text) - Word in Arabic
      - `transliteration` (text) - English transliteration
      - `translation` (text) - English translation
      - `context` (text) - Usage context
      - `examples` (jsonb) - Example sentences
      - `audio_url` (text) - URL to pronunciation audio
      - `category` (text[]) - Word categories/tags
      - `created_at` (timestamptz)

    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `level` (int) - Current user level
      - `xp` (int) - Experience points
      - `streak` (int) - Daily streak count
      - `last_active` (timestamptz)
      - `preferences` (jsonb) - User preferences

    - `learned_words`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `word_id` (uuid) - Reference to vocabulary_items
      - `learned_at` (timestamptz)
      - `strength` (int) - Learning strength (1-5)
      - `next_review` (timestamptz)

    - `lessons`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `content` (jsonb)
      - `level` (int)
      - `order` (int)
      - `type` (text) - Lesson type (grammar, vocabulary, pronunciation)

    - `lesson_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `lesson_id` (uuid) - Reference to lessons
      - `completed` (boolean)
      - `score` (int)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own progress data
    - Vocabulary and lessons are readable by all authenticated users
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create vocabulary_items table
CREATE TABLE vocabulary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic text NOT NULL,
  transliteration text NOT NULL,
  translation text NOT NULL,
  context text,
  examples jsonb DEFAULT '[]'::jsonb,
  audio_url text,
  category text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  streak int DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  preferences jsonb DEFAULT '{
    "daily_goal": 10,
    "notifications": true,
    "theme": "light"
  }'::jsonb,
  UNIQUE (user_id)
);

-- Create learned_words table
CREATE TABLE learned_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid REFERENCES vocabulary_items(id) ON DELETE CASCADE,
  learned_at timestamptz DEFAULT now(),
  strength int DEFAULT 1 CHECK (strength BETWEEN 1 AND 5),
  next_review timestamptz DEFAULT now(),
  UNIQUE (user_id, word_id)
);

-- Create lessons table
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content jsonb NOT NULL,
  level int NOT NULL,
  order_num int NOT NULL,
  type text NOT NULL CHECK (type IN ('grammar', 'vocabulary', 'pronunciation')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (level, order_num)
);

-- Create lesson_progress table
CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  score int CHECK (score BETWEEN 0 AND 100),
  completed_at timestamptz,
  UNIQUE (user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Vocabulary items policies
CREATE POLICY "Vocabulary items are viewable by authenticated users"
  ON vocabulary_items FOR SELECT
  TO authenticated
  USING (true);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Learned words policies
CREATE POLICY "Users can view their learned words"
  ON learned_words FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their learned words"
  ON learned_words FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Lessons policies
CREATE POLICY "Lessons are viewable by authenticated users"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);

-- Lesson progress policies
CREATE POLICY "Users can view their lesson progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their lesson progress"
  ON lesson_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX vocabulary_items_category_idx ON vocabulary_items USING GIN (category);
CREATE INDEX learned_words_user_id_idx ON learned_words(user_id);
CREATE INDEX learned_words_next_review_idx ON learned_words(next_review);
CREATE INDEX lesson_progress_user_id_idx ON lesson_progress(user_id);
CREATE INDEX lessons_level_order_idx ON lessons(level, order_num);