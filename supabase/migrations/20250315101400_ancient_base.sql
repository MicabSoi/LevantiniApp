/*
  # Add Quizzes Table

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `level` (integer) - References lesson level
      - `order_num` (integer) - Question order within lesson
      - `correct_letter` (text) - The correct answer letter

  2. Security
    - Enable RLS on quizzes table
    - Add policy for authenticated users to view quizzes
    
  3. Indexes
    - Add index on level and order_num for better query performance
*/

-- Create quizzes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quizzes') THEN
    CREATE TABLE quizzes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      level integer NOT NULL,
      order_num integer NOT NULL,
      correct_letter text NOT NULL,
      UNIQUE(level, order_num)
    );
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' 
    AND policyname = 'Quizzes are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Quizzes are viewable by authenticated users"
      ON quizzes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create index for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'quizzes_level_order_idx'
    AND n.nspname = 'public'
  ) THEN
    CREATE INDEX quizzes_level_order_idx ON quizzes(level, order_num);
  END IF;
END $$;