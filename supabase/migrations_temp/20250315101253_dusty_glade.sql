/*
  # Quiz System Schema Update

  1. Changes
    - Safely check for existing tables before creation
    - Add missing indexes and policies if needed
    - Preserve existing data

  2. Security
    - Enable RLS on tables
    - Add policies for authenticated users
*/

-- Check and create quiz_options table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_options') THEN
    CREATE TABLE quiz_options (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      level integer NOT NULL,
      order_num integer NOT NULL,
      letter text NOT NULL
    );

    -- Add foreign key if quizzes table exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quizzes') THEN
      ALTER TABLE quiz_options
        ADD CONSTRAINT quiz_options_level_order_num_fkey
        FOREIGN KEY (level, order_num) 
        REFERENCES quizzes(level, order_num) 
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ensure RLS is enabled on quiz_options
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

-- Create or replace quiz_options policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_options' 
    AND policyname = 'Quiz options are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Quiz options are viewable by authenticated users"
      ON quiz_options
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create missing indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'quiz_options_level_order_idx'
    AND n.nspname = 'public'
  ) THEN
    CREATE INDEX quiz_options_level_order_idx ON quiz_options(level, order_num);
  END IF;
END $$;