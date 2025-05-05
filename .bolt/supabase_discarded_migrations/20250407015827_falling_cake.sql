/*
  # Flashcard System Schema

  1. New Tables
    - `decks`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `name` (text)
      - `description` (text)
      - `emoji` (text)
      - `is_default` (boolean)
      - `archived` (boolean)
      - `created_at` (timestamptz)

    - `flashcards`
      - `id` (uuid, primary key)
      - `deck_id` (uuid) - References decks
      - `front` (text)
      - `back` (text)
      - `transliteration` (text)
      - `image_url` (text)
      - `audio_url` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)

    - `default_decks` and `default_flashcards`
      - Same structure as decks and flashcards
      - Used as templates for new users

  2. Security
    - Enable RLS on all tables
    - Users can only access their own decks and flashcards
    - Default tables are read-only for authenticated users
*/

-- Create decks table
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL,
  is_default boolean DEFAULT false,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create flashcards table
CREATE TABLE flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  transliteration text,
  image_url text,
  audio_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create default_decks table
CREATE TABLE default_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create default_flashcards table
CREATE TABLE default_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_deck_id uuid REFERENCES default_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  transliteration text,
  image_url text,
  audio_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_flashcards ENABLE ROW LEVEL SECURITY;

-- Decks policies
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON decks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view flashcards in their decks"
  ON flashcards FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert flashcards in their decks"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = deck_id
    AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update flashcards in their decks"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete flashcards in their decks"
  ON flashcards FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  ));

-- Default decks/flashcards policies (read-only)
CREATE POLICY "Authenticated users can view default decks"
  ON default_decks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view default flashcards"
  ON default_flashcards FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX decks_user_id_idx ON decks(user_id);
CREATE INDEX flashcards_deck_id_idx ON flashcards(deck_id);
CREATE INDEX flashcards_tags_idx ON flashcards USING GIN(tags);